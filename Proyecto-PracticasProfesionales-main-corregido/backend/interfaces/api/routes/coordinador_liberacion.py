from __future__ import annotations

import base64
import re
from datetime import date
from decimal import Decimal
from pathlib import Path
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.services.notificacion_service import crear_notificacion
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import obtener_id_alumno_actual, requerir_alumno_actual_o_roles, requerir_roles
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.evaluacion import EvaluacionModel
from infrastructure.persistence.models.evaluacion_empresa_alumno import EvaluacionEmpresaAlumnoModel
from infrastructure.persistence.models.expediente import ExpedienteModel
from infrastructure.persistence.models.horas import HorasModel
from infrastructure.persistence.models.incidencia_practica import IncidenciaPracticaModel
from infrastructure.persistence.models.liberacion import LiberacionModel
from infrastructure.persistence.models.reporte import ReporteModel


router = APIRouter(
    prefix="/coordinador/liberacion",
    tags=["Coordinador - Liberacion"],
)
HORAS_META = 480
REPORTES_META = 2
UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads" / "liberaciones"
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
    name = Path(filename).name.strip() or "liberacion.pdf"
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)


def _decode_base64(content: str) -> bytes:
    payload = content.split(",", 1)[1] if "," in content else content
    try:
        return base64.b64decode(payload, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Archivo base64 invalido") from exc


def _archivo_liberacion_response(ruta_archivo: Optional[str]):
    if not ruta_archivo:
        return {"documento_liberacion": None, "documento_nombre": None, "documento_url": None}
    nombre = Path(ruta_archivo).name
    return {
        "documento_liberacion": ruta_archivo,
        "documento_nombre": nombre,
        "documento_url": f"/uploads/liberaciones/{nombre}",
    }


def _nombre_usuario(usuario) -> str:
    if usuario is None:
        return "Sin usuario"
    return " ".join(
        parte
        for parte in [usuario.nombre, usuario.apellido_paterno, usuario.apellido_materno]
        if parte
    ) or usuario.correo


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
    reportes_aprobados = (
        db.query(ReporteModel)
        .filter(
            ReporteModel.id_asignacion == asignacion.id_asignacion,
            ReporteModel.estado_reporte == "Aprobado",
        )
        .count()
    )
    evaluacion_docente = (
        db.query(EvaluacionModel)
        .filter(
            EvaluacionModel.id_asignacion == asignacion.id_asignacion,
            EvaluacionModel.tipo_evaluacion == "Docente",
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
        "horas_completas": _float(horas_aprobadas) >= HORAS_META,
        "reportes_aprobados": (
            reportes_aprobados >= REPORTES_META
            and reportes_pendientes == 0
            and reportes_rechazados == 0
        ),
        "evaluacion_docente": evaluacion_docente is not None,
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
    liberado = bool(
        (liberacion and liberacion.estado_liberacion == "Emitida")
        or (alumno and alumno.estado_alumno == "Liberado")
    )
    estado_seguimiento = "Liberado" if liberado else "Listo" if listo else "Bloqueado"

    return {
        "id_asignacion": asignacion.id_asignacion,
        "id_alumno": asignacion.id_alumno,
        "alumno": _nombre_usuario(alumno.usuario if alumno else None),
        "matricula": alumno.matricula if alumno else None,
        "carrera": alumno.carrera.nombre if alumno and alumno.carrera else "Sin carrera",
        "empresa": asignacion.empresa.nombre_empresa if asignacion.empresa else "Sin empresa",
        "vacante": asignacion.vacante.titulo if asignacion.vacante else "Sin vacante",
        "estado_alumno": alumno.estado_alumno if alumno else None,
        "estado_asignacion": asignacion.estado_asignacion,
        "estado_seguimiento": estado_seguimiento,
        "horas_aprobadas": _float(horas_aprobadas),
        "horas_meta": HORAS_META,
        "reportes_pendientes": reportes_pendientes,
        "reportes_rechazados": reportes_rechazados,
        "reportes_aprobados": reportes_aprobados,
        "incidencias_abiertas": incidencias_abiertas,
        "requisitos": requisitos,
        "faltantes": faltantes,
        "listo_liberacion": listo,
        "liberacion": (
            {
                "id_liberacion": liberacion.id_liberacion,
                "estado_liberacion": liberacion.estado_liberacion,
                "fecha_liberacion": liberacion.fecha_liberacion.isoformat() if liberacion.fecha_liberacion else None,
                **_archivo_liberacion_response(liberacion.documento_liberacion),
                "observaciones": liberacion.observaciones,
            }
            if liberacion
            else None
        ),
    }


def _estado_liberacion_sin_asignacion(db: Session, alumno: AlumnoModel) -> dict:
    expediente_aprobado = _expediente_aprobado(db, alumno.id_alumno)
    requisitos = {
        "expediente_aprobado": expediente_aprobado,
        "horas_completas": False,
        "reportes_aprobados": False,
        "evaluacion_docente": False,
        "evaluacion_empresa": False,
        "evaluacion_alumno_empresa": False,
        "incidencias_cerradas": True,
    }
    faltantes = [nombre for nombre, completo in requisitos.items() if not completo]
    liberado = alumno.estado_alumno == "Liberado"
    return {
        "id_asignacion": None,
        "id_alumno": alumno.id_alumno,
        "alumno": _nombre_usuario(alumno.usuario),
        "matricula": alumno.matricula,
        "carrera": alumno.carrera.nombre if alumno.carrera else "Sin carrera",
        "empresa": "Sin empresa asignada",
        "vacante": "Sin vacante",
        "estado_alumno": alumno.estado_alumno,
        "estado_asignacion": "Sin asignacion",
        "estado_seguimiento": "Liberado" if liberado else "Bloqueado",
        "horas_aprobadas": 0.0,
        "horas_meta": HORAS_META,
        "reportes_pendientes": 0,
        "reportes_rechazados": 0,
        "reportes_aprobados": 0,
        "incidencias_abiertas": 0,
        "requisitos": requisitos,
        "faltantes": faltantes,
        "listo_liberacion": False,
        "liberacion": None,
    }


@router.get("/", dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))])
def listar_candidatos_liberacion(db: Session = Depends(obtener_db)):
    estudiantes = (
        db.query(AlumnoModel)
        .options(
            joinedload(AlumnoModel.usuario),
            joinedload(AlumnoModel.carrera),
        )
        .all()
    )
    alumnos = []
    for estudiante in estudiantes:
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
                AsignacionModel.id_alumno == estudiante.id_alumno,
                AsignacionModel.estado_asignacion.in_(["Activa", "Finalizada"]),
            )
            .order_by(AsignacionModel.fecha_asignacion.desc(), AsignacionModel.id_asignacion.desc())
            .first()
        )
        alumnos.append(
            _estado_liberacion(db, asignacion)
            if asignacion
            else _estado_liberacion_sin_asignacion(db, estudiante)
        )

    alumnos.sort(key=lambda alumno: (alumno["alumno"].lower(), alumno["id_alumno"]))
    return {
        "resumen": {
            "total": len(alumnos),
            "listos": sum(1 for alumno in alumnos if alumno["estado_seguimiento"] == "Listo"),
            "bloqueados": sum(1 for alumno in alumnos if alumno["estado_seguimiento"] == "Bloqueado"),
            "liberados": sum(1 for alumno in alumnos if alumno["estado_seguimiento"] == "Liberado"),
        },
        "alumnos": alumnos,
    }


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
        asignacion.alumno.estado_alumno = "Liberado"
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
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF, DOC o DOCX")

    contenido = _decode_base64(datos.contenido_base64)
    if len(contenido) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El documento no debe superar 10 MB")

    safe_name = _safe_filename(datos.nombre_archivo)
    extension = MIMES_PERMITIDOS[datos.mime_type]
    if not safe_name.lower().endswith(extension):
        safe_name = f"{safe_name}{extension}"

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    stored_name = f"liberacion_asignacion_{id_asignacion}_{uuid4().hex}_{safe_name}"
    ruta = UPLOAD_DIR / stored_name
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
        asignacion.alumno.estado_alumno = "Liberado"
        crear_notificacion(
            db,
            asignacion.alumno.id_usuario,
            "Liberacion emitida",
            "Coordinacion anexo tu constancia de liberacion. Ya puedes descargarla desde Mi Liberacion.",
        )

    db.commit()
    db.refresh(asignacion)
    return _estado_liberacion(db, asignacion)
