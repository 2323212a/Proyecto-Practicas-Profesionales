from __future__ import annotations

import base64
import mimetypes
import re
import unicodedata
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.services.regla_practica_carrera_service import obtener_regla_practica_para_alumno
from app.services.notificacion_service import crear_notificacion
from app.services.upload_security import normalizar_nombre_archivo, resolver_archivo_en_uploads, validar_documento_liberacion
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import obtener_id_alumno_actual, obtener_usuario_actual, requerir_alumno_actual_o_roles, requerir_roles
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.evaluacion import EvaluacionModel
from infrastructure.persistence.models.evaluacion_empresa_alumno import EvaluacionEmpresaAlumnoModel
from infrastructure.persistence.models.expediente import ExpedienteModel
from infrastructure.persistence.models.horas import HorasModel
from infrastructure.persistence.models.incidencia_practica import IncidenciaPracticaModel
from infrastructure.persistence.models.liberacion import LiberacionModel
from infrastructure.persistence.models.reporte import ReporteModel
from infrastructure.persistence.models.usuario import UsuarioModel


router = APIRouter(
    prefix="/coordinador/liberacion",
    tags=["Coordinador - Liberacion"],
)
UPLOADS_DIR = Path(__file__).resolve().parents[3] / "uploads"
UPLOAD_DIR = UPLOADS_DIR / "expedientes"
MIMES_PERMITIDOS = {
    "application/pdf": ".pdf",
    "application/msword": ".doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": ".docx",
}


class AnexarLiberacionRequest(BaseModel):
    nombre_archivo: str
    contenido_base64: str
    mime_type: str = "application/pdf"


def _safe_filename(filename: str) -> str:
    return normalizar_nombre_archivo(filename, "liberacion.pdf")


def _slug_carpeta(valor: str | None, fallback: str) -> str:
    texto = valor or fallback
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    texto = re.sub(r"[^A-Za-z0-9]+", "_", texto).strip("_").lower()
    return texto or fallback


def _carpeta_liberacion_alumno(asignacion: AsignacionModel) -> Path:
    alumno = asignacion.alumno
    if alumno is None:
        return UPLOAD_DIR / "alumnos" / "sin_alumno" / f"convocatoria_{asignacion.id_convocatoria}" / "liberacion"
    nombre_alumno = "_".join(
        parte for parte in [alumno.nombre, alumno.apellido_paterno, alumno.apellido_materno, alumno.matricula] if parte
    )
    tipo_practica = (
        asignacion.tipo_practica.nombre
        if asignacion.tipo_practica
        else alumno.tipo_practica.nombre
        if alumno.tipo_practica
        else "practica"
    )
    return (
        UPLOAD_DIR
        / "alumnos"
        / _slug_carpeta(nombre_alumno, f"alumno_{alumno.id_alumno}")
        / _slug_carpeta(tipo_practica, "practica")
        / f"convocatoria_{asignacion.id_convocatoria}"
        / "liberacion"
    )


def _decode_base64(content: str) -> bytes:
    payload = content.split(",", 1)[1] if "," in content else content
    try:
        return base64.b64decode(payload, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Archivo base64 invalido") from exc


def _archivo_liberacion_response(liberacion: Optional[LiberacionModel]):
    if liberacion is None or not liberacion.documento_liberacion:
        return {"documento_liberacion": None, "documento_nombre": None, "documento_url": None}
    ruta_archivo = liberacion.documento_liberacion
    nombre = Path(ruta_archivo).name
    return {
        "documento_liberacion": ruta_archivo,
        "documento_nombre": nombre,
        "documento_url": f"/coordinador/liberacion/documentos/{liberacion.id_liberacion}/archivo",
    }


def _nombre_rol(usuario: UsuarioModel) -> str | None:
    return usuario.rol.nombre if usuario.rol is not None else None


def _asegurar_permiso_liberacion(usuario: UsuarioModel, liberacion: LiberacionModel) -> None:
    rol = _nombre_rol(usuario)
    if rol in {"Administrador", "Coordinador de Practicas", "Direccion"}:
        return
    asignacion = liberacion.asignacion
    if (
        rol == "Alumno"
        and usuario.alumno is not None
        and asignacion is not None
        and asignacion.id_alumno == usuario.alumno.id_alumno
    ):
        return
    raise HTTPException(status_code=403, detail="No tienes permisos para ver esta liberacion")


def _file_response_segura(ruta_archivo: str | None, nombre_archivo: str | None):
    ruta = resolver_archivo_en_uploads(ruta_archivo, UPLOADS_DIR)
    media_type = mimetypes.guess_type(nombre_archivo or ruta.name)[0] or "application/octet-stream"
    return FileResponse(ruta, media_type=media_type, filename=nombre_archivo or ruta.name)


def _nombre_perfil(perfil) -> str:
    if perfil is None:
        return "Sin usuario"
    return " ".join(
        parte
        for parte in [
            getattr(perfil, "nombre", None),
            getattr(perfil, "apellido_paterno", None),
            getattr(perfil, "apellido_materno", None),
        ]
        if parte
    ) or "Sin usuario"


def _float(valor) -> float:
    if isinstance(valor, Decimal):
        return float(valor)
    return float(valor or 0)


def _expediente_aprobado(db: Session, id_alumno: int) -> bool:
    return (
        db.query(ExpedienteModel)
        .filter(
            ExpedienteModel.id_alumno == id_alumno,
            ExpedienteModel.estado_expediente == "Aprobado",
        )
        .count()
        > 0
    )


def _estado_liberacion(db: Session, asignacion: AsignacionModel) -> dict:
    alumno = asignacion.alumno
    regla_practica = obtener_regla_practica_para_alumno(db, alumno) if alumno is not None else None
    horas_meta = regla_practica.horas_requeridas if regla_practica is not None else 0
    origen_regla = regla_practica.origen_regla if regla_practica is not None else "sin_configurar"
    advertencia_regla = (
        regla_practica.advertencia
        if regla_practica is not None
        else "No hay una regla de práctica configurada para el alumno."
    )
    horas_aprobadas = (
        db.query(func.coalesce(func.sum(HorasModel.horas_realizadas), 0))
        .filter(
            HorasModel.id_asignacion == asignacion.id_asignacion,
            HorasModel.estado_horas == "Aprobada",
        )
        .scalar()
        or 0
    )
    reportes_pendientes = (
        db.query(ReporteModel)
        .filter(
            ReporteModel.id_asignacion == asignacion.id_asignacion,
            ReporteModel.estado_reporte == "Pendiente",
        )
        .count()
    )
    reportes_rechazados = (
        db.query(ReporteModel)
        .filter(
            ReporteModel.id_asignacion == asignacion.id_asignacion,
            ReporteModel.estado_reporte == "Rechazado",
        )
        .count()
    )
    evaluacion_asesor = (
        db.query(EvaluacionModel)
        .filter(
            EvaluacionModel.id_asignacion == asignacion.id_asignacion,
            EvaluacionModel.tipo_evaluacion == "Asesor",
        )
        .first()
    )
    evaluacion_empresa = (
        db.query(EvaluacionModel)
        .filter(
            EvaluacionModel.id_asignacion == asignacion.id_asignacion,
            EvaluacionModel.tipo_evaluacion == "Empresa",
        )
        .first()
    )
    evaluacion_alumno_empresa = (
        db.query(EvaluacionEmpresaAlumnoModel)
        .filter(EvaluacionEmpresaAlumnoModel.id_asignacion == asignacion.id_asignacion)
        .first()
    )
    incidencias_abiertas = (
        db.query(IncidenciaPracticaModel)
        .filter(
            IncidenciaPracticaModel.id_asignacion == asignacion.id_asignacion,
            IncidenciaPracticaModel.estado.in_(["Abierta", "En seguimiento"]),
        )
        .count()
    )
    liberacion = asignacion.liberacion

    requisitos = {
        "expediente_aprobado": _expediente_aprobado(db, asignacion.id_alumno),
        "horas_completas": horas_meta > 0 and _float(horas_aprobadas) >= horas_meta,
        "reportes_aprobados": reportes_pendientes == 0 and reportes_rechazados == 0,
        "evaluacion_asesor": evaluacion_asesor is not None,
        "evaluacion_empresa": evaluacion_empresa is not None,
        "evaluacion_alumno_empresa": evaluacion_alumno_empresa is not None,
        "incidencias_cerradas": incidencias_abiertas == 0,
    }
    faltantes = [
        nombre
        for nombre, completo in requisitos.items()
        if not completo
    ]
    listo = len(faltantes) == 0

    return {
        "id_asignacion": asignacion.id_asignacion,
        "id_alumno": asignacion.id_alumno,
        "alumno": _nombre_perfil(alumno),
        "matricula": alumno.matricula if alumno else None,
        "carrera": alumno.carrera.nombre if alumno and alumno.carrera else "Sin carrera",
        "empresa": asignacion.empresa.nombre_empresa if asignacion.empresa else "Sin empresa",
        "vacante": asignacion.vacante.titulo if asignacion.vacante else "Sin vacante",
        "estado_alumno": alumno.estado_alumno if alumno else None,
        "estado_asignacion": asignacion.estado_asignacion,
        "horas_aprobadas": _float(horas_aprobadas),
        "horas_meta": horas_meta,
        "origen_regla": origen_regla,
        "advertencia_regla": advertencia_regla,
        "reportes_pendientes": reportes_pendientes,
        "reportes_rechazados": reportes_rechazados,
        "incidencias_abiertas": incidencias_abiertas,
        "requisitos": requisitos,
        "faltantes": faltantes,
        "listo_liberacion": listo,
        "liberacion": (
            {
                "id_liberacion": liberacion.id_liberacion,
                "estado_liberacion": liberacion.estado_liberacion,
                "fecha_liberacion": liberacion.fecha_liberacion.isoformat() if liberacion.fecha_liberacion else None,
                **_archivo_liberacion_response(liberacion),
                "observaciones": liberacion.observaciones,
            }
            if liberacion
            else None
        ),
    }


@router.get("/", dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))])
def listar_candidatos_liberacion(db: Session = Depends(obtener_db)):
    asignaciones = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.empresa),
            joinedload(AsignacionModel.vacante),
            joinedload(AsignacionModel.liberacion),
        )
        .filter(AsignacionModel.estado_asignacion.in_(["Activa", "Finalizada"]))
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .all()
    )
    alumnos = [_estado_liberacion(db, asignacion) for asignacion in asignaciones]
    return {
        "resumen": {
            "total": len(alumnos),
            "listos": sum(1 for alumno in alumnos if alumno["listo_liberacion"] and not alumno["liberacion"]),
            "bloqueados": sum(1 for alumno in alumnos if not alumno["listo_liberacion"]),
            "liberados": sum(1 for alumno in alumnos if alumno["liberacion"] and alumno["liberacion"]["estado_liberacion"] == "Emitida"),
        },
        "alumnos": alumnos,
    }


@router.get("/documentos/{id_liberacion}/archivo")
def descargar_liberacion_segura(
    id_liberacion: int,
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
    db: Session = Depends(obtener_db),
):
    liberacion = (
        db.query(LiberacionModel)
        .options(joinedload(LiberacionModel.asignacion))
        .filter(LiberacionModel.id_liberacion == id_liberacion)
        .first()
    )
    if liberacion is None or not liberacion.documento_liberacion:
        raise HTTPException(status_code=404, detail="Liberacion no encontrada")
    _asegurar_permiso_liberacion(usuario_actual, liberacion)
    return _file_response_segura(liberacion.documento_liberacion, Path(liberacion.documento_liberacion).name)


@router.get(
    "/alumno/me",
    dependencies=[Depends(requerir_roles(["Alumno", "Administrador"]))],
)
def obtener_mi_liberacion_alumno(
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    return obtener_liberacion_alumno(id_alumno, db)


@router.get(
    "/alumno/{id_alumno}",
    dependencies=[Depends(requerir_alumno_actual_o_roles(["Coordinador de Practicas", "Administrador"]))],
)
def obtener_liberacion_alumno(id_alumno: int, db: Session = Depends(obtener_db)):
    asignacion = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.empresa),
            joinedload(AsignacionModel.vacante),
            joinedload(AsignacionModel.liberacion),
        )
        .filter(
            AsignacionModel.id_alumno == id_alumno,
            AsignacionModel.estado_asignacion.in_(["Activa", "Finalizada"]),
        )
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .first()
    )
    if asignacion is None:
        return {"alumno": None}
    return {"alumno": _estado_liberacion(db, asignacion)}


@router.post(
    "/{id_asignacion}/emitir",
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)
def emitir_liberacion_coordinador(id_asignacion: int, db: Session = Depends(obtener_db)):
    asignacion = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.empresa),
            joinedload(AsignacionModel.vacante),
            joinedload(AsignacionModel.liberacion),
        )
        .filter(AsignacionModel.id_asignacion == id_asignacion)
        .first()
    )
    if asignacion is None:
        raise HTTPException(status_code=404, detail="Asignacion no encontrada")

    estado = _estado_liberacion(db, asignacion)
    if not estado["listo_liberacion"]:
        raise HTTPException(status_code=400, detail={"mensaje": "El alumno aun no cumple requisitos", "faltantes": estado["faltantes"]})

    liberacion = asignacion.liberacion
    if liberacion is None:
        liberacion = LiberacionModel(id_asignacion=id_asignacion)
        db.add(liberacion)

    liberacion.estado_liberacion = "Emitida"
    liberacion.fecha_liberacion = date.today()
    if not liberacion.documento_liberacion:
        raise HTTPException(status_code=400, detail="Anexa primero el documento de liberacion")
    liberacion.observaciones = "Liberacion emitida por coordinacion."
    asignacion.estado_asignacion = "Finalizada"
    if asignacion.alumno:
        crear_notificacion(
            db,
            asignacion.alumno.id_usuario,
            "Liberacion emitida",
            "Coordinacion emitio tu liberacion de practicas. Ya puedes descargar la constancia.",
        )

    db.commit()
    db.refresh(asignacion)
    return _estado_liberacion(db, asignacion)


@router.post(
    "/{id_asignacion}/documento",
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)
def anexar_documento_liberacion(
    id_asignacion: int,
    datos: AnexarLiberacionRequest,
    db: Session = Depends(obtener_db),
):
    asignacion = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.empresa),
            joinedload(AsignacionModel.vacante),
            joinedload(AsignacionModel.liberacion),
        )
        .filter(AsignacionModel.id_asignacion == id_asignacion)
        .first()
    )
    if asignacion is None:
        raise HTTPException(status_code=404, detail="Asignacion no encontrada")

    estado = _estado_liberacion(db, asignacion)
    if not estado["listo_liberacion"]:
        raise HTTPException(status_code=400, detail={"mensaje": "El alumno aun no cumple requisitos", "faltantes": estado["faltantes"]})

    if datos.mime_type not in MIMES_PERMITIDOS:
        raise HTTPException(status_code=400, detail="Tipo de archivo no permitido.")

    contenido = _decode_base64(datos.contenido_base64)
    validar_documento_liberacion(contenido, datos.nombre_archivo, datos.mime_type)

    safe_name = _safe_filename(datos.nombre_archivo)
    extension = MIMES_PERMITIDOS[datos.mime_type]
    if not safe_name.lower().endswith(extension):
        safe_name = f"{safe_name}{extension}"

    carpeta = _carpeta_liberacion_alumno(asignacion)
    carpeta.mkdir(parents=True, exist_ok=True)
    ruta = carpeta / f"liberacion_asignacion_{id_asignacion}_{uuid4().hex}_{safe_name}"
    ruta.write_bytes(contenido)

    liberacion = asignacion.liberacion
    if liberacion is None:
        liberacion = LiberacionModel(id_asignacion=id_asignacion)
        db.add(liberacion)

    liberacion.documento_liberacion = str(ruta)
    liberacion.estado_liberacion = "Emitida"
    liberacion.fecha_liberacion = date.today()
    liberacion.observaciones = "Documento de liberacion anexado por coordinacion."
    asignacion.estado_asignacion = "Finalizada"
    if asignacion.alumno:
        crear_notificacion(
            db,
            asignacion.alumno.id_usuario,
            "Liberacion emitida",
            "Coordinacion anexo tu constancia de liberacion. Ya puedes descargarla desde Mi Liberacion.",
        )

    db.commit()
    db.refresh(asignacion)
    return _estado_liberacion(db, asignacion)
