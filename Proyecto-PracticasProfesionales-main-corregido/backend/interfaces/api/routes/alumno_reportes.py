from __future__ import annotations

import base64
import mimetypes
import re
import unicodedata
from datetime import date
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.services.notificacion_service import crear_notificacion
from app.services.upload_security import normalizar_nombre_archivo, resolver_archivo_en_uploads, validar_documento_usuario
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import obtener_id_alumno_actual, obtener_usuario_actual, requerir_alumno_actual_o_roles
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.expediente import ExpedienteModel
from infrastructure.persistence.models.horas import HorasModel
from infrastructure.persistence.models.reporte import ReporteModel
from infrastructure.persistence.models.usuario import UsuarioModel


router = APIRouter(
    prefix="/alumno/reportes",
    tags=["Alumno - Reportes"],
    dependencies=[Depends(requerir_alumno_actual_o_roles(["Administrador"]))],
)
UPLOADS_DIR = Path(__file__).resolve().parents[3] / "uploads"
UPLOAD_DIR = UPLOADS_DIR / "expedientes"
HORAS_META = 480

REPORTES_CONFIG = {
    "Parcial": {
        "titulo": "Reporte parcial",
        "descripcion": "Se habilita cuando cumples la mitad de tus horas aprobadas.",
        "horas_requeridas": HORAS_META // 2,
    },
    "Final": {
        "titulo": "Reporte final",
        "descripcion": "Se habilita al completar tus horas de practicas.",
        "horas_requeridas": HORAS_META,
    },
}


class SubirReporteAlumnoRequest(BaseModel):
    tipo_reporte: str
    descripcion: str | None = None
    nombre_archivo: str
    contenido_base64: str
    mime_type: str = "application/pdf"


def _safe_filename(filename: str) -> str:
    return normalizar_nombre_archivo(filename, "reporte.pdf")


def _slug_carpeta(valor: str | None, fallback: str) -> str:
    texto = valor or fallback
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    texto = re.sub(r"[^A-Za-z0-9]+", "_", texto).strip("_").lower()
    return texto or fallback


def _carpeta_reportes_alumno(alumno: AlumnoModel, asignacion: AsignacionModel, tipo_reporte: str) -> Path:
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
        / "reportes"
        / _slug_carpeta(tipo_reporte, "reporte")
    )


def _decode_base64(content: str) -> bytes:
    payload = content.split(",", 1)[1] if "," in content else content
    try:
        return base64.b64decode(payload, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Archivo base64 invalido") from exc


def _asignacion_activa(db: Session, id_alumno: int):
    return (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.empresa),
            joinedload(AsignacionModel.vacante),
            joinedload(AsignacionModel.asesor),
            joinedload(AsignacionModel.reportes),
        )
        .filter(
            AsignacionModel.id_alumno == id_alumno,
            AsignacionModel.estado_asignacion == "Activa",
        )
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .first()
    )


def _expediente_actual(db: Session, id_alumno: int):
    return (
        db.query(ExpedienteModel)
        .filter(ExpedienteModel.id_alumno == id_alumno)
        .order_by(ExpedienteModel.fecha_creacion.desc())
        .first()
    )


def _validar_fases_iniciales(db: Session, alumno: AlumnoModel, asignacion: AsignacionModel | None):
    expediente = _expediente_actual(db, alumno.id_alumno)
    if expediente is None:
        return False, "Primero debes cargar tus documentos iniciales."

    if expediente.estado_expediente != "Aprobado":
        return False, "Tus documentos iniciales deben estar aprobados por coordinacion."

    if asignacion is None:
        return False, "Debes tener una empresa asignada antes de subir reportes."

    return True, None


def _horas_aprobadas(db: Session, id_asignacion: int) -> float:
    total = (
        db.query(func.coalesce(func.sum(HorasModel.horas_realizadas), 0))
        .filter(
            HorasModel.id_asignacion == id_asignacion,
            HorasModel.estado_horas == "Aprobada",
        )
        .scalar()
        or 0
    )
    return float(total)


def _tipo_reporte(reporte: ReporteModel) -> str | None:
    if reporte.tipo_reporte in REPORTES_CONFIG:
        return reporte.tipo_reporte
    titulo = (reporte.titulo or "").lower()
    if "final" in titulo:
        return "Final"
    if "parcial" in titulo:
        return "Parcial"
    return None


def _reportes_por_tipo(reportes: list[ReporteModel]) -> dict[str, ReporteModel]:
    resultado: dict[str, ReporteModel] = {}
    ordenados = sorted(reportes, key=lambda item: (item.fecha_entrega, item.id_reporte), reverse=True)
    for reporte in ordenados:
        tipo = _tipo_reporte(reporte)
        if tipo in REPORTES_CONFIG and tipo not in resultado:
            resultado[tipo] = reporte
    return resultado


def _reporte_response(reporte: ReporteModel):
    return {
        "id_reporte": reporte.id_reporte,
        "id_asignacion": reporte.id_asignacion,
        "tipo_reporte": _tipo_reporte(reporte),
        "titulo": reporte.titulo,
        "descripcion": reporte.descripcion,
        "archivo": Path(reporte.archivo).name,
        "url": f"/alumno/reportes/reportes/{reporte.id_reporte}/archivo" if reporte.archivo else None,
        "fecha_entrega": reporte.fecha_entrega.isoformat(),
        "estado": reporte.estado_reporte,
    }


def _es_admin(usuario: UsuarioModel) -> bool:
    return usuario.rol is not None and usuario.rol.nombre == "Administrador"


def _asegurar_permiso_reporte_alumno(usuario: UsuarioModel, reporte: ReporteModel) -> None:
    if _es_admin(usuario):
        return
    asignacion = reporte.asignacion
    if (
        usuario.alumno is not None
        and asignacion is not None
        and asignacion.id_alumno == usuario.alumno.id_alumno
    ):
        return
    raise HTTPException(status_code=403, detail="No tienes permisos para ver este reporte")


def _file_response_segura(ruta_archivo: str | None, nombre_archivo: str | None):
    ruta = resolver_archivo_en_uploads(ruta_archivo, UPLOADS_DIR)
    media_type = mimetypes.guess_type(nombre_archivo or ruta.name)[0] or "application/octet-stream"
    return FileResponse(ruta, media_type=media_type, filename=nombre_archivo or ruta.name)


def _espacios_response(
    reportes: list[ReporteModel],
    horas_actuales: float,
    puede_subir: bool,
    motivo_fase: str | None,
):
    por_tipo = _reportes_por_tipo(reportes)
    espacios = []
    for tipo, config in REPORTES_CONFIG.items():
        reporte = por_tipo.get(tipo)
        horas_requeridas = config["horas_requeridas"]
        desbloqueado = puede_subir and horas_actuales >= horas_requeridas
        motivo_bloqueo = None
        puede_enviar = desbloqueado

        if not puede_subir:
            motivo_bloqueo = motivo_fase
            puede_enviar = False
        elif horas_actuales < horas_requeridas:
            motivo_bloqueo = f"Necesitas {horas_requeridas:g} horas aprobadas para habilitar este reporte."
            puede_enviar = False

        if reporte is not None and reporte.estado_reporte in {"Pendiente", "Aprobado"}:
            puede_enviar = False
            if reporte.estado_reporte == "Pendiente":
                motivo_bloqueo = "Este reporte ya fue enviado y esta en revision."
            else:
                motivo_bloqueo = "Este reporte ya fue aprobado por tu asesor."

        espacios.append(
            {
                "tipo_reporte": tipo,
                "titulo": config["titulo"],
                "descripcion": config["descripcion"],
                "horas_requeridas": horas_requeridas,
                "horas_actuales": horas_actuales,
                "desbloqueado": desbloqueado,
                "puede_enviar": puede_enviar,
                "motivo_bloqueo": motivo_bloqueo,
                "reporte": _reporte_response(reporte) if reporte is not None else None,
            }
        )
    return espacios


@router.get("/me/")
def listar_mis_reportes_alumno(
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    return listar_reportes_alumno(id_alumno, db)


@router.post("/me/subir")
def subir_mi_reporte_alumno(
    datos: SubirReporteAlumnoRequest,
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    return subir_reporte_alumno(id_alumno, datos, db)


@router.get("/reportes/{id_reporte}/archivo")
def descargar_reporte_alumno_seguro(
    id_reporte: int,
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
    db: Session = Depends(obtener_db),
):
    reporte = (
        db.query(ReporteModel)
        .options(joinedload(ReporteModel.asignacion))
        .filter(ReporteModel.id_reporte == id_reporte)
        .first()
    )
    if reporte is None or not reporte.archivo:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    _asegurar_permiso_reporte_alumno(usuario_actual, reporte)
    return _file_response_segura(reporte.archivo, Path(reporte.archivo).name)


@router.get("/{id_alumno:int}")
def listar_reportes_alumno(id_alumno: int, db: Session = Depends(obtener_db)):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    asignacion = _asignacion_activa(db, id_alumno)
    puede_subir, motivo_bloqueo = _validar_fases_iniciales(db, alumno, asignacion)
    reportes = []
    horas_actuales = 0.0

    if asignacion is not None:
        reportes = sorted(asignacion.reportes, key=lambda item: (item.fecha_entrega, item.id_reporte), reverse=True)
        horas_actuales = _horas_aprobadas(db, asignacion.id_asignacion)

    reportes_serializados = [_reporte_response(reporte) for reporte in reportes]
    return {
        "puede_subir": puede_subir,
        "motivo_bloqueo": motivo_bloqueo,
        "estado_alumno": alumno.estado_alumno,
        "horas_actuales": horas_actuales,
        "horas_meta": HORAS_META,
        "asignacion": (
            {
                "id_asignacion": asignacion.id_asignacion,
                "empresa": asignacion.empresa.nombre_empresa if asignacion.empresa else "Sin empresa",
                "vacante": asignacion.vacante.titulo if asignacion.vacante else "Sin vacante",
                "fecha_inicio": asignacion.fecha_asignacion.isoformat(),
                "estado_asignacion": asignacion.estado_asignacion,
            }
            if asignacion is not None
            else None
        ),
        "resumen": {
            "total": len(reportes),
            "pendientes": sum(1 for reporte in reportes if reporte.estado_reporte == "Pendiente"),
            "aprobados": sum(1 for reporte in reportes if reporte.estado_reporte == "Aprobado"),
            "rechazados": sum(1 for reporte in reportes if reporte.estado_reporte == "Rechazado"),
        },
        "espacios": _espacios_response(reportes, horas_actuales, puede_subir, motivo_bloqueo),
        "reportes": reportes_serializados,
    }


@router.post("/{id_alumno:int}/subir")
def subir_reporte_alumno(
    id_alumno: int,
    datos: SubirReporteAlumnoRequest,
    db: Session = Depends(obtener_db),
):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    asignacion = _asignacion_activa(db, id_alumno)
    puede_subir, motivo_bloqueo = _validar_fases_iniciales(db, alumno, asignacion)
    if not puede_subir or asignacion is None:
        raise HTTPException(status_code=403, detail=motivo_bloqueo or "No puedes subir reportes todavia")

    tipo = datos.tipo_reporte.strip().title()
    if tipo not in REPORTES_CONFIG:
        raise HTTPException(status_code=400, detail="El reporte debe ser Parcial o Final")

    horas_actuales = _horas_aprobadas(db, asignacion.id_asignacion)
    horas_requeridas = REPORTES_CONFIG[tipo]["horas_requeridas"]
    if horas_actuales < horas_requeridas:
        raise HTTPException(status_code=403, detail=f"Necesitas {horas_requeridas:g} horas aprobadas para enviar este reporte")

    por_tipo = _reportes_por_tipo(list(asignacion.reportes))
    existente = por_tipo.get(tipo)
    if existente is not None and existente.estado_reporte in {"Pendiente", "Aprobado"}:
        raise HTTPException(status_code=409, detail="Este reporte ya fue enviado o aprobado")

    contenido = _decode_base64(datos.contenido_base64)
    validar_documento_usuario(contenido, datos.nombre_archivo, datos.mime_type)

    safe_name = _safe_filename(datos.nombre_archivo)
    carpeta = _carpeta_reportes_alumno(alumno, asignacion, tipo)
    carpeta.mkdir(parents=True, exist_ok=True)
    ruta = carpeta / f"{tipo.lower()}_{uuid4().hex}_{safe_name}"
    ruta.write_bytes(contenido)

    if existente is None:
        reporte = ReporteModel(
            id_asignacion=asignacion.id_asignacion,
            tipo_reporte=tipo,
            titulo=REPORTES_CONFIG[tipo]["titulo"],
            descripcion=datos.descripcion,
            archivo=str(ruta),
            fecha_entrega=date.today(),
            estado_reporte="Pendiente",
        )
        db.add(reporte)
    else:
        reporte = existente
        reporte.tipo_reporte = tipo
        reporte.descripcion = datos.descripcion
        reporte.archivo = str(ruta)
        reporte.fecha_entrega = date.today()
        reporte.estado_reporte = "Pendiente"

    crear_notificacion(
        db,
        asignacion.asesor.id_usuario if asignacion.asesor else None,
        "Reporte nuevo para revision",
        f"{alumno.matricula} subio el {REPORTES_CONFIG[tipo]['titulo'].lower()}.",
    )
    db.commit()
    db.refresh(reporte)
    return _reporte_response(reporte)
