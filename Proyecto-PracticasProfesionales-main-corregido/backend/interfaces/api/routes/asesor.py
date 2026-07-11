from __future__ import annotations

from datetime import date
from decimal import Decimal
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.services.notificacion_service import crear_notificacion
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import obtener_id_docente_actual, requerir_docente_actual_o_roles
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.docente_asesor import DocenteAsesorModel
from infrastructure.persistence.models.evaluacion import EvaluacionModel
from infrastructure.persistence.models.horas import HorasModel
from infrastructure.persistence.models.reporte import ReporteModel


router = APIRouter(
    prefix="/asesor",
    tags=["Asesor"],
    dependencies=[Depends(requerir_docente_actual_o_roles(["Administrador"]))],
)

HORAS_META = 480
REPORTES_META = 2


class CambiarEstadoReporteAsesorRequest(BaseModel):
    estado: str
    observacion: str | None = None


class GuardarEvaluacionDocenteRequest(BaseModel):
    id_asignacion: int
    calificacion: Decimal
    comentarios: str | None = None


def validar_docente(db: Session, id_docente: int):
    docente = (
        db.query(DocenteAsesorModel)
        .filter(DocenteAsesorModel.id_docente == id_docente)
        .first()
    )
    if docente is None:
        raise HTTPException(status_code=404, detail="Asesor no encontrado")
    return docente


def nombre_completo(usuario):
    if usuario is None:
        return "Alumno sin usuario"

    partes = [
        usuario.nombre,
        usuario.apellido_paterno,
        usuario.apellido_materno,
    ]
    return " ".join(parte for parte in partes if parte) or usuario.correo


def calcular_estado(horas_aprobadas: Decimal, reportes_pendientes: int, reportes_rechazados: int):
    if horas_aprobadas >= HORAS_META and reportes_pendientes == 0 and reportes_rechazados == 0:
        return "Listo para cierre"

    if reportes_rechazados > 0:
        return "Con observaciones"

    return "En seguimiento"



def tipo_reporte(reporte: ReporteModel) -> str | None:
    titulo = (reporte.titulo or "").lower()
    if "final" in titulo:
        return "Final"
    if "parcial" in titulo:
        return "Parcial"
    return None

def serializar_asignacion(db: Session, asignacion: AsignacionModel):
    horas_aprobadas = (
        db.query(func.coalesce(func.sum(HorasModel.horas_realizadas), 0))
        .filter(
            HorasModel.id_asignacion == asignacion.id_asignacion,
            HorasModel.estado_horas == "Aprobada",
        )
        .scalar()
        or 0
    )
    reportes_entregados = (
        db.query(ReporteModel)
        .filter(ReporteModel.id_asignacion == asignacion.id_asignacion)
        .count()
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
    ultimo_reporte = (
        db.query(ReporteModel)
        .filter(ReporteModel.id_asignacion == asignacion.id_asignacion)
        .order_by(ReporteModel.fecha_entrega.desc(), ReporteModel.id_reporte.desc())
        .first()
    )

    alumno = asignacion.alumno
    usuario = alumno.usuario if alumno is not None else None
    carrera = alumno.carrera if alumno is not None else None
    empresa = asignacion.empresa

    return {
        "id_asignacion": asignacion.id_asignacion,
        "id_alumno": alumno.id_alumno if alumno is not None else None,
        "nombre": nombre_completo(usuario),
        "correo": usuario.correo if usuario is not None else None,
        "matricula": alumno.matricula if alumno is not None else None,
        "carrera": carrera.nombre if carrera is not None else "Sin carrera",
        "empresa": empresa.nombre_empresa if empresa is not None else "Sin empresa",
        "horas_actuales": float(horas_aprobadas),
        "horas_meta": HORAS_META,
        "reportes_entregados": reportes_entregados,
        "reportes_meta": REPORTES_META,
        "reportes_pendientes": reportes_pendientes,
        "estado": calcular_estado(horas_aprobadas, reportes_pendientes, reportes_rechazados),
        "ultimo_reporte": ultimo_reporte.titulo if ultimo_reporte is not None else "Sin reportes",
        "estado_asignacion": asignacion.estado_asignacion,
        "fecha_asignacion": asignacion.fecha_asignacion,
    }


def serializar_reporte(reporte: ReporteModel) -> dict:
    asignacion = reporte.asignacion
    alumno = asignacion.alumno
    usuario = alumno.usuario if alumno is not None else None
    carrera = alumno.carrera if alumno is not None else None
    empresa = asignacion.empresa

    return {
        "id_reporte": reporte.id_reporte,
        "id_asignacion": reporte.id_asignacion,
        "id_alumno": alumno.id_alumno if alumno is not None else None,
        "alumno": nombre_completo(usuario),
        "matricula": alumno.matricula if alumno is not None else None,
        "carrera": carrera.nombre if carrera is not None else "Sin carrera",
        "empresa": empresa.nombre_empresa if empresa is not None else "Sin empresa",
        "tipo_reporte": tipo_reporte(reporte),
        "titulo": reporte.titulo,
        "descripcion": reporte.descripcion,
        "archivo": Path(reporte.archivo).name,
        "url": f"/uploads/reportes/{Path(reporte.archivo).name}",
        "fecha_entrega": reporte.fecha_entrega.isoformat(),
        "estado": reporte.estado_reporte,
    }


def serializar_evaluacion_docente(db: Session, asignacion: AsignacionModel) -> dict:
    evaluacion = (
        db.query(EvaluacionModel)
        .filter(
            EvaluacionModel.id_asignacion == asignacion.id_asignacion,
            EvaluacionModel.tipo_evaluacion == "Docente",
        )
        .first()
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
    horas_aprobadas = (
        db.query(func.coalesce(func.sum(HorasModel.horas_realizadas), 0))
        .filter(
            HorasModel.id_asignacion == asignacion.id_asignacion,
            HorasModel.estado_horas == "Aprobada",
        )
        .scalar()
        or 0
    )
    alumno = asignacion.alumno
    usuario = alumno.usuario if alumno is not None else None
    carrera = alumno.carrera if alumno is not None else None

    puede_evaluar = reportes_pendientes == 0 and reportes_rechazados == 0
    motivo_bloqueo = None if puede_evaluar else "El alumno tiene reportes pendientes o rechazados."

    return {
        "id_asignacion": asignacion.id_asignacion,
        "id_alumno": alumno.id_alumno if alumno is not None else None,
        "alumno": nombre_completo(usuario),
        "matricula": alumno.matricula if alumno is not None else None,
        "carrera": carrera.nombre if carrera is not None else "Sin carrera",
        "empresa": asignacion.empresa.nombre_empresa if asignacion.empresa else "Sin empresa",
        "horas_aprobadas": float(horas_aprobadas),
        "reportes_pendientes": reportes_pendientes,
        "reportes_rechazados": reportes_rechazados,
        "puede_evaluar": puede_evaluar,
        "motivo_bloqueo": motivo_bloqueo,
        "evaluacion": (
            {
                "id_evaluacion": evaluacion.id_evaluacion,
                "calificacion": float(evaluacion.calificacion),
                "comentarios": evaluacion.comentarios,
                "fecha_evaluacion": evaluacion.fecha_evaluacion.isoformat(),
            }
            if evaluacion is not None
            else None
        ),
    }


@router.get("/{id_docente:int}/alumnos")
def listar_alumnos_asignados(id_docente: int, db: Session = Depends(obtener_db)):
    validar_docente(db, id_docente)

    asignaciones = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.empresa),
        )
        .filter(AsignacionModel.id_docente == id_docente)
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .all()
    )

    alumnos = [serializar_asignacion(db, asignacion) for asignacion in asignaciones]
    resumen = {
        "total": len(alumnos),
        "pendientes": sum(1 for alumno in alumnos if alumno["reportes_entregados"] < alumno["reportes_meta"]),
        "observaciones": sum(1 for alumno in alumnos if alumno["estado"] == "Con observaciones"),
        "cierre": sum(1 for alumno in alumnos if alumno["estado"] == "Listo para cierre"),
    }

    return {
        "resumen": resumen,
        "alumnos": alumnos,
    }


@router.get("/me/alumnos")
def listar_mis_alumnos_asignados(
    id_docente: int = Depends(obtener_id_docente_actual),
    db: Session = Depends(obtener_db),
):
    return listar_alumnos_asignados(id_docente, db)


@router.get("/{id_docente:int}/dashboard")
def obtener_dashboard_asesor(id_docente: int, db: Session = Depends(obtener_db)):
    datos = listar_alumnos_asignados(id_docente, db)
    return datos["resumen"]


@router.get("/me/dashboard")
def obtener_mi_dashboard_asesor(
    id_docente: int = Depends(obtener_id_docente_actual),
    db: Session = Depends(obtener_db),
):
    return obtener_dashboard_asesor(id_docente, db)


@router.get("/{id_docente:int}/reportes")
def listar_reportes_asesor(id_docente: int, db: Session = Depends(obtener_db)):
    validar_docente(db, id_docente)

    reportes = (
        db.query(ReporteModel)
        .join(AsignacionModel, ReporteModel.id_asignacion == AsignacionModel.id_asignacion)
        .options(
            joinedload(ReporteModel.asignacion)
            .joinedload(AsignacionModel.alumno)
            .joinedload(AlumnoModel.usuario),
            joinedload(ReporteModel.asignacion)
            .joinedload(AsignacionModel.alumno)
            .joinedload(AlumnoModel.carrera),
            joinedload(ReporteModel.asignacion).joinedload(AsignacionModel.empresa),
        )
        .filter(AsignacionModel.id_docente == id_docente)
        .order_by(ReporteModel.fecha_entrega.desc(), ReporteModel.id_reporte.desc())
        .all()
    )

    registros = [serializar_reporte(reporte) for reporte in reportes]
    return {
        "resumen": {
            "total": len(registros),
            "pendientes": sum(1 for reporte in registros if reporte["estado"] == "Pendiente"),
            "aprobados": sum(1 for reporte in registros if reporte["estado"] == "Aprobado"),
            "rechazados": sum(1 for reporte in registros if reporte["estado"] == "Rechazado"),
        },
        "reportes": registros,
    }


@router.get("/me/reportes")
def listar_mis_reportes_asesor(
    id_docente: int = Depends(obtener_id_docente_actual),
    db: Session = Depends(obtener_db),
):
    return listar_reportes_asesor(id_docente, db)


@router.patch("/{id_docente:int}/reportes/{id_reporte:int}/estado")
def cambiar_estado_reporte_asesor(
    id_docente: int,
    id_reporte: int,
    payload: CambiarEstadoReporteAsesorRequest,
    db: Session = Depends(obtener_db),
):
    validar_docente(db, id_docente)
    estado = payload.estado.strip()
    if estado not in {"Aprobado", "Rechazado"}:
        raise HTTPException(status_code=400, detail="El estado debe ser Aprobado o Rechazado")

    reporte = (
        db.query(ReporteModel)
        .join(AsignacionModel, ReporteModel.id_asignacion == AsignacionModel.id_asignacion)
        .options(
            joinedload(ReporteModel.asignacion)
            .joinedload(AsignacionModel.alumno)
            .joinedload(AlumnoModel.usuario),
            joinedload(ReporteModel.asignacion)
            .joinedload(AsignacionModel.alumno)
            .joinedload(AlumnoModel.carrera),
            joinedload(ReporteModel.asignacion).joinedload(AsignacionModel.empresa),
        )
        .filter(
            ReporteModel.id_reporte == id_reporte,
            AsignacionModel.id_docente == id_docente,
        )
        .first()
    )
    if reporte is None:
        raise HTTPException(status_code=404, detail="Reporte no encontrado para este asesor")

    reporte.estado_reporte = estado
    if payload.observacion and payload.observacion.strip():
        nota = f"Observacion del asesor: {payload.observacion.strip()}"
        reporte.descripcion = f"{reporte.descripcion or ''}\n\n{nota}".strip()

    alumno = reporte.asignacion.alumno if reporte.asignacion else None
    crear_notificacion(
        db,
        alumno.id_usuario if alumno else None,
        f"Reporte {estado.lower()}",
        f"Tu reporte '{reporte.titulo}' fue marcado como {estado} por tu asesor."
        + (f" Observacion: {payload.observacion.strip()}" if payload.observacion and payload.observacion.strip() else ""),
    )
    db.commit()
    db.refresh(reporte)
    return serializar_reporte(reporte)


@router.patch("/me/reportes/{id_reporte}/estado")
def cambiar_estado_mi_reporte_asesor(
    id_reporte: int,
    payload: CambiarEstadoReporteAsesorRequest,
    id_docente: int = Depends(obtener_id_docente_actual),
    db: Session = Depends(obtener_db),
):
    return cambiar_estado_reporte_asesor(id_docente, id_reporte, payload, db)


@router.get("/{id_docente:int}/evaluaciones")
def listar_evaluaciones_docente(id_docente: int, db: Session = Depends(obtener_db)):
    validar_docente(db, id_docente)
    asignaciones = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.empresa),
        )
        .filter(AsignacionModel.id_docente == id_docente)
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .all()
    )
    registros = [serializar_evaluacion_docente(db, asignacion) for asignacion in asignaciones]

    return {
        "resumen": {
            "total": len(registros),
            "evaluados": sum(1 for registro in registros if registro["evaluacion"] is not None),
            "pendientes": sum(1 for registro in registros if registro["evaluacion"] is None),
            "bloqueados": sum(
                1
                for registro in registros
                if registro["evaluacion"] is None and not registro["puede_evaluar"]
            ),
        },
        "alumnos": registros,
    }


@router.get("/me/evaluaciones")
def listar_mis_evaluaciones_docente(
    id_docente: int = Depends(obtener_id_docente_actual),
    db: Session = Depends(obtener_db),
):
    return listar_evaluaciones_docente(id_docente, db)


@router.post("/{id_docente:int}/evaluaciones")
def guardar_evaluacion_docente(
    id_docente: int,
    datos: GuardarEvaluacionDocenteRequest,
    db: Session = Depends(obtener_db),
):
    docente = validar_docente(db, id_docente)
    if datos.calificacion < 0 or datos.calificacion > 100:
        raise HTTPException(status_code=400, detail="La calificacion debe estar entre 0 y 100")

    asignacion = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.empresa),
        )
        .filter(
            AsignacionModel.id_asignacion == datos.id_asignacion,
            AsignacionModel.id_docente == id_docente,
        )
        .first()
    )
    if asignacion is None:
        raise HTTPException(status_code=404, detail="Asignacion no encontrada para este asesor")

    estado = serializar_evaluacion_docente(db, asignacion)
    if not estado["puede_evaluar"]:
        raise HTTPException(status_code=400, detail=estado["motivo_bloqueo"])

    evaluacion = (
        db.query(EvaluacionModel)
        .filter(
            EvaluacionModel.id_asignacion == asignacion.id_asignacion,
            EvaluacionModel.tipo_evaluacion == "Docente",
        )
        .first()
    )
    if evaluacion is None:
        evaluacion = EvaluacionModel(
            id_asignacion=asignacion.id_asignacion,
            id_usuario_evaluador=docente.id_usuario,
            tipo_evaluacion="Docente",
            calificacion=datos.calificacion,
            comentarios=datos.comentarios,
            fecha_evaluacion=date.today(),
        )
        db.add(evaluacion)
    else:
        evaluacion.calificacion = datos.calificacion
        evaluacion.comentarios = datos.comentarios
        evaluacion.fecha_evaluacion = date.today()
        evaluacion.id_usuario_evaluador = docente.id_usuario

    alumno = asignacion.alumno
    crear_notificacion(
        db,
        alumno.id_usuario if alumno else None,
        "Evaluacion docente registrada",
        "Tu asesor academico registro la evaluacion final de tus practicas.",
    )
    db.commit()
    db.refresh(evaluacion)
    return serializar_evaluacion_docente(db, asignacion)


@router.post("/me/evaluaciones")
def guardar_mi_evaluacion_docente(
    datos: GuardarEvaluacionDocenteRequest,
    id_docente: int = Depends(obtener_id_docente_actual),
    db: Session = Depends(obtener_db),
):
    return guardar_evaluacion_docente(id_docente, datos, db)
