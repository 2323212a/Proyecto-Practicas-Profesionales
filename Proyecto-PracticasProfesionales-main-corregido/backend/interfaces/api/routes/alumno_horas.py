from __future__ import annotations

from collections import defaultdict
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session, joinedload

from app.services.regla_practica_carrera_service import obtener_regla_practica_para_alumno
from app.services.notificacion_service import crear_notificacion
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import obtener_id_alumno_actual, requerir_alumno_actual_o_roles
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.horas import HorasModel
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel


router = APIRouter(
    prefix="/alumno/horas",
    tags=["Alumno - Horas"],
    dependencies=[Depends(requerir_alumno_actual_o_roles(["Administrador"]))],
)


class CrearHorasAlumnoRequest(BaseModel):
    fecha: date
    horas_realizadas: Decimal = Field(gt=0)
    actividad: str
    evidencia_archivo: str | None = None


def _decimal_to_float(valor) -> float:
    if isinstance(valor, Decimal):
        return float(valor)
    return float(valor or 0)


def _asignacion_activa(db: Session, id_alumno: int):
    return (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.empresa),
            joinedload(AsignacionModel.vacante),
            joinedload(AsignacionModel.horas),
        )
        .filter(
            AsignacionModel.id_alumno == id_alumno,
            AsignacionModel.estado_asignacion == "Activa",
        )
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .first()
    )


def _horas_response(horas: HorasModel):
    return {
        "id_horas": horas.id_horas,
        "id_asignacion": horas.id_asignacion,
        "fecha": horas.fecha.isoformat(),
        "horas_realizadas": _decimal_to_float(horas.horas_realizadas),
        "actividad": horas.actividad,
        "evidencia_archivo": horas.evidencia_archivo,
        "estado_horas": horas.estado_horas,
        "observaciones": horas.observaciones,
        "fecha_registro": horas.fecha_registro.isoformat(),
    }


@router.get("/me/")
def listar_mis_horas_alumno(
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    return listar_horas_alumno(id_alumno, db)


@router.post("/me/")
def crear_mis_horas_alumno(
    datos: CrearHorasAlumnoRequest,
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    return crear_horas_alumno(id_alumno, datos, db)


@router.get("/{id_alumno:int}")
def listar_horas_alumno(id_alumno: int, db: Session = Depends(obtener_db)):
    alumno = (
        db.query(AlumnoModel)
        .options(joinedload(AlumnoModel.tipo_practica))
        .filter(AlumnoModel.id_alumno == id_alumno)
        .first()
    )
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    regla_practica = obtener_regla_practica_para_alumno(db, alumno)
    total_meta = regla_practica.horas_requeridas if regla_practica is not None else 0
    origen_regla = regla_practica.origen_regla if regla_practica is not None else "sin_configurar"
    advertencia_regla = (
        regla_practica.advertencia
        if regla_practica is not None
        else "No tienes un tipo de práctica configurado. Solicita revisión al administrador."
    )

    asignacion = _asignacion_activa(db, id_alumno)
    if asignacion is None:
        return {
            "asignacion": None,
            "resumen": {
                "total_meta": total_meta,
                "aprobadas": 0,
                "pendientes": 0,
                "rechazadas": 0,
                "progreso": 0,
                "origen_regla": origen_regla,
                "advertencia_regla": advertencia_regla,
            },
            "horas": [],
            "semanas": [],
        }

    horas = sorted(asignacion.horas, key=lambda item: item.fecha, reverse=True)
    aprobadas = sum(
        _decimal_to_float(item.horas_realizadas)
        for item in horas
        if item.estado_horas == "Aprobada"
    )
    pendientes = sum(
        _decimal_to_float(item.horas_realizadas)
        for item in horas
        if item.estado_horas == "Pendiente"
    )
    rechazadas = sum(
        _decimal_to_float(item.horas_realizadas)
        for item in horas
        if item.estado_horas == "Rechazada"
    )
    progreso = round((aprobadas / total_meta) * 100) if total_meta else 0

    semanas_map = defaultdict(float)
    for item in horas:
        semana = item.fecha.isocalendar().week
        semanas_map[f"S{semana}"] += _decimal_to_float(item.horas_realizadas)

    return {
        "asignacion": {
            "id_asignacion": asignacion.id_asignacion,
            "empresa": asignacion.empresa.nombre_empresa if asignacion.empresa else "Sin empresa",
            "vacante": asignacion.vacante.titulo if asignacion.vacante else "Sin vacante",
            "fecha_inicio": asignacion.fecha_asignacion.isoformat(),
            "estado_asignacion": asignacion.estado_asignacion,
        },
        "resumen": {
            "total_meta": total_meta,
            "aprobadas": aprobadas,
            "pendientes": pendientes,
            "rechazadas": rechazadas,
            "progreso": progreso,
            "origen_regla": origen_regla,
            "advertencia_regla": advertencia_regla,
        },
        "horas": [_horas_response(item) for item in horas],
        "semanas": [
            {"semana": semana, "horas": horas_semana}
            for semana, horas_semana in sorted(semanas_map.items())
        ],
    }


@router.post("/{id_alumno:int}")
def crear_horas_alumno(
    id_alumno: int,
    datos: CrearHorasAlumnoRequest,
    db: Session = Depends(obtener_db),
):
    asignacion = _asignacion_activa(db, id_alumno)
    if asignacion is None:
        raise HTTPException(status_code=400, detail="No tienes una asignacion activa")

    horas = HorasModel(
        id_asignacion=asignacion.id_asignacion,
        fecha=datos.fecha,
        horas_realizadas=datos.horas_realizadas,
        actividad=datos.actividad,
        evidencia_archivo=datos.evidencia_archivo,
        estado_horas="Pendiente",
    )
    db.add(horas)
    responsables = (
        db.query(ResponsableEmpresaModel)
        .filter(ResponsableEmpresaModel.id_empresa == asignacion.id_empresa)
        .all()
    )
    for responsable in responsables:
        crear_notificacion(
            db,
            responsable.id_usuario,
            "Horas pendientes de revisión",
            f"Un alumno registro {datos.horas_realizadas} horas para revisión de la unidad receptora.",
        )
    db.commit()
    db.refresh(horas)
    return _horas_response(horas)
