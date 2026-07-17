from __future__ import annotations

import json
from datetime import date
from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session, joinedload

from app.services.notificacion_service import crear_notificacion, notificar_roles
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import obtener_id_alumno_actual, obtener_id_empresa_actual, requerir_alumno_actual_o_roles, requerir_empresa_actual_o_roles, requerir_roles
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.evaluacion import EvaluacionModel
from infrastructure.persistence.models.evaluacion_empresa_alumno import EvaluacionEmpresaAlumnoModel
from infrastructure.persistence.models.horas import HorasModel
from infrastructure.persistence.models.incidencia_practica import IncidenciaPracticaModel
from infrastructure.persistence.models.reporte import ReporteModel
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel


router = APIRouter(tags=["Seguimiento de Practicas"])
HORAS_META = 480

PREGUNTAS_EVALUACION_ALUMNO_EMPRESA = [
    "Actividades relacionadas con mi carrera",
    "Cumplimiento del plan de trabajo",
    "Acompanamiento del responsable",
    "Recursos y herramientas suficientes",
    "Experiencia formativa",
    "Recomendaria la empresa",
]

RESPUESTAS_EVALUACION = ["Excelente", "Bueno", "Regular", "Deficiente"]

INCIDENCIAS_EVALUACION_ALUMNO_EMPRESA = [
    "No se respeto el plan de trabajo",
    "Actividades ajenas a la carrera",
    "Falta de supervision",
    "Problemas de horario",
    "Ambiente laboral inadecuado",
]


class EvaluacionAlumnoEmpresaRequest(BaseModel):
    calificacion: Decimal = Field(ge=0, le=100)
    respuestas: dict[str, str] = Field(default_factory=dict)
    incidencias_detectadas: list[str] = Field(default_factory=list)
    comentarios: str | None = None


class EvaluacionEmpresaAlumnoRequest(BaseModel):
    id_asignacion: int
    calificacion: Decimal = Field(ge=0, le=100)
    comentarios: str | None = None


class CrearIncidenciaRequest(BaseModel):
    tipo_incidencia: str
    prioridad: str = "Media"
    descripcion: str


class ActualizarIncidenciaRequest(BaseModel):
    estado: str
    respuesta_coordinacion: str | None = None


class PreguntaEvaluacionResponse(BaseModel):
    id: str
    texto: str


class PlantillaEvaluacionAlumnoEmpresaResponse(BaseModel):
    preguntas: list[PreguntaEvaluacionResponse]
    respuestas: list[str]
    incidencias_sugeridas: list[str]


def _nombre_usuario(usuario) -> str:
    if usuario is None:
        return "Sin usuario"
    return " ".join(
        parte
        for parte in [usuario.nombre, usuario.apellido_paterno, usuario.apellido_materno]
        if parte
    ) or usuario.correo


def _decimal(valor) -> float:
    if isinstance(valor, Decimal):
        return float(valor)
    return float(valor or 0)


def _asignacion_activa_alumno(db: Session, id_alumno: int):
    return (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.empresa),
            joinedload(AsignacionModel.vacante),
        )
        .filter(
            AsignacionModel.id_alumno == id_alumno,
            AsignacionModel.estado_asignacion == "Activa",
        )
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .first()
    )


def _asignaciones_empresa(db: Session, id_empresa: int):
    return (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.empresa),
            joinedload(AsignacionModel.vacante),
        )
        .filter(
            AsignacionModel.id_empresa == id_empresa,
            AsignacionModel.estado_asignacion == "Activa",
        )
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .all()
    )


def _estado_cierre(db: Session, asignacion: AsignacionModel):
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
    puede_evaluar = (
        _decimal(horas_aprobadas) >= HORAS_META
        and reportes_pendientes == 0
        and reportes_rechazados == 0
    )
    motivo_bloqueo = None
    if not puede_evaluar:
        motivo_bloqueo = "Para evaluar al cierre deben estar completas las horas aprobadas y los reportes sin pendientes."

    return {
        "horas_aprobadas": _decimal(horas_aprobadas),
        "reportes_pendientes": reportes_pendientes,
        "reportes_rechazados": reportes_rechazados,
        "puede_evaluar": puede_evaluar,
        "motivo_bloqueo": motivo_bloqueo,
    }


def _evaluacion_alumno_empresa_response(evaluacion: EvaluacionEmpresaAlumnoModel | None):
    if evaluacion is None:
        return None
    return {
        "id_evaluacion_empresa_alumno": evaluacion.id_evaluacion_empresa_alumno,
        "calificacion": _decimal(evaluacion.calificacion),
        "respuestas": json.loads(evaluacion.respuestas or "{}"),
        "incidencias_detectadas": json.loads(evaluacion.incidencias_detectadas or "[]"),
        "comentarios": evaluacion.comentarios,
        "fecha_evaluacion": evaluacion.fecha_evaluacion.isoformat(),
    }


def _evaluacion_empresa_alumno_response(evaluacion: EvaluacionModel | None):
    if evaluacion is None:
        return None
    return {
        "id_evaluacion": evaluacion.id_evaluacion,
        "calificacion": _decimal(evaluacion.calificacion),
        "comentarios": evaluacion.comentarios,
        "fecha_evaluacion": evaluacion.fecha_evaluacion.isoformat(),
    }


def _incidencia_response(incidencia: IncidenciaPracticaModel):
    asignacion = incidencia.asignacion
    alumno = asignacion.alumno if asignacion else None
    empresa = asignacion.empresa if asignacion else None
    return {
        "id_incidencia": incidencia.id_incidencia,
        "id_asignacion": incidencia.id_asignacion,
        "alumno": _nombre_usuario(alumno.usuario) if alumno and alumno.usuario else "Sin alumno",
        "matricula": alumno.matricula if alumno else None,
        "empresa": empresa.nombre_empresa if empresa else "Sin empresa",
        "reportante": incidencia.reportante,
        "tipo_incidencia": incidencia.tipo_incidencia,
        "prioridad": incidencia.prioridad,
        "descripcion": incidencia.descripcion,
        "estado": incidencia.estado,
        "respuesta_coordinacion": incidencia.respuesta_coordinacion,
        "fecha_reporte": incidencia.fecha_reporte.isoformat() if incidencia.fecha_reporte else None,
        "fecha_actualizacion": incidencia.fecha_actualizacion.isoformat() if incidencia.fecha_actualizacion else None,
    }


def _asignacion_response(asignacion: AsignacionModel):
    return {
        "id_asignacion": asignacion.id_asignacion,
        "id_alumno": asignacion.id_alumno,
        "alumno": _nombre_usuario(asignacion.alumno.usuario) if asignacion.alumno and asignacion.alumno.usuario else "Sin alumno",
        "matricula": asignacion.alumno.matricula if asignacion.alumno else None,
        "carrera": asignacion.alumno.carrera.nombre if asignacion.alumno and asignacion.alumno.carrera else "Sin carrera",
        "empresa": asignacion.empresa.nombre_empresa if asignacion.empresa else "Sin empresa",
        "vacante": asignacion.vacante.titulo if asignacion.vacante else "Sin vacante",
    }


@router.get(
    "/alumno/seguimiento/me",
    dependencies=[Depends(requerir_roles(["Alumno", "Administrador"]))],
)
def obtener_mi_seguimiento_alumno(
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    return obtener_seguimiento_alumno(id_alumno, db)


@router.post(
    "/alumno/seguimiento/me/evaluacion-empresa",
    dependencies=[Depends(requerir_roles(["Alumno", "Administrador"]))],
)
def guardar_mi_evaluacion_alumno_empresa(
    datos: EvaluacionAlumnoEmpresaRequest,
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    return guardar_evaluacion_alumno_empresa(id_alumno, datos, db)


@router.post(
    "/alumno/seguimiento/me/incidencias",
    dependencies=[Depends(requerir_roles(["Alumno", "Administrador"]))],
)
def crear_mi_incidencia_alumno(
    datos: CrearIncidenciaRequest,
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    return crear_incidencia_alumno(id_alumno, datos, db)


@router.get(
    "/alumno/seguimiento/plantilla-evaluacion-empresa",
    response_model=PlantillaEvaluacionAlumnoEmpresaResponse,
    dependencies=[Depends(requerir_roles(["Alumno", "Administrador"]))],
)
def obtener_plantilla_evaluacion_alumno_empresa():
    return {
        "preguntas": [
            {"id": f"p{index + 1}", "texto": pregunta}
            for index, pregunta in enumerate(PREGUNTAS_EVALUACION_ALUMNO_EMPRESA)
        ],
        "respuestas": RESPUESTAS_EVALUACION,
        "incidencias_sugeridas": INCIDENCIAS_EVALUACION_ALUMNO_EMPRESA,
    }


@router.get(
    "/alumno/seguimiento/{id_alumno}",
    dependencies=[Depends(requerir_alumno_actual_o_roles(["Administrador"]))],
)
def obtener_seguimiento_alumno(id_alumno: int, db: Session = Depends(obtener_db)):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    asignacion = _asignacion_activa_alumno(db, id_alumno)
    if asignacion is None:
        return {"asignacion": None, "cierre": None, "evaluacion_empresa": None, "incidencias": []}

    evaluacion = (
        db.query(EvaluacionEmpresaAlumnoModel)
        .filter(EvaluacionEmpresaAlumnoModel.id_asignacion == asignacion.id_asignacion)
        .first()
    )
    incidencias = (
        db.query(IncidenciaPracticaModel)
        .options(joinedload(IncidenciaPracticaModel.asignacion).joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario), joinedload(IncidenciaPracticaModel.asignacion).joinedload(AsignacionModel.empresa))
        .filter(IncidenciaPracticaModel.id_asignacion == asignacion.id_asignacion)
        .order_by(IncidenciaPracticaModel.fecha_reporte.desc())
        .all()
    )
    return {
        "asignacion": _asignacion_response(asignacion),
        "cierre": _estado_cierre(db, asignacion),
        "evaluacion_empresa": _evaluacion_alumno_empresa_response(evaluacion),
        "incidencias": [_incidencia_response(item) for item in incidencias],
    }


@router.post(
    "/alumno/seguimiento/{id_alumno}/evaluacion-empresa",
    dependencies=[Depends(requerir_alumno_actual_o_roles(["Administrador"]))],
)
def guardar_evaluacion_alumno_empresa(
    id_alumno: int,
    datos: EvaluacionAlumnoEmpresaRequest,
    db: Session = Depends(obtener_db),
):
    asignacion = _asignacion_activa_alumno(db, id_alumno)
    if asignacion is None:
        raise HTTPException(status_code=400, detail="No tienes asignacion activa")
    cierre = _estado_cierre(db, asignacion)
    if not cierre["puede_evaluar"]:
        raise HTTPException(status_code=400, detail=cierre["motivo_bloqueo"])

    evaluacion = (
        db.query(EvaluacionEmpresaAlumnoModel)
        .filter(EvaluacionEmpresaAlumnoModel.id_asignacion == asignacion.id_asignacion)
        .first()
    )
    payload = {
        "id_asignacion": asignacion.id_asignacion,
        "id_alumno": id_alumno,
        "calificacion": datos.calificacion,
        "respuestas": json.dumps(datos.respuestas, ensure_ascii=False),
        "incidencias_detectadas": json.dumps(datos.incidencias_detectadas, ensure_ascii=False),
        "comentarios": datos.comentarios,
        "fecha_evaluacion": date.today(),
    }
    if evaluacion is None:
        evaluacion = EvaluacionEmpresaAlumnoModel(**payload)
        db.add(evaluacion)
    else:
        for campo, valor in payload.items():
            setattr(evaluacion, campo, valor)
    notificar_roles(
        db,
        ["Coordinador de Practicas", "Administrador"],
        "Evaluacion alumno-empresa registrada",
        f"{_nombre_usuario(asignacion.alumno.usuario) if asignacion.alumno and asignacion.alumno.usuario else 'Un alumno'} evaluo a {asignacion.empresa.nombre_empresa if asignacion.empresa else 'su empresa'}.",
    )
    db.commit()
    db.refresh(evaluacion)
    return _evaluacion_alumno_empresa_response(evaluacion)


@router.post(
    "/alumno/seguimiento/{id_alumno}/incidencias",
    dependencies=[Depends(requerir_alumno_actual_o_roles(["Administrador"]))],
)
def crear_incidencia_alumno(
    id_alumno: int,
    datos: CrearIncidenciaRequest,
    db: Session = Depends(obtener_db),
):
    asignacion = _asignacion_activa_alumno(db, id_alumno)
    if asignacion is None or asignacion.alumno is None:
        raise HTTPException(status_code=400, detail="No tienes asignacion activa")
    if datos.prioridad not in {"Baja", "Media", "Alta"}:
        raise HTTPException(status_code=400, detail="Prioridad no valida")
    incidencia = IncidenciaPracticaModel(
        id_asignacion=asignacion.id_asignacion,
        id_usuario_reportante=asignacion.alumno.id_usuario,
        reportante="Alumno",
        tipo_incidencia=datos.tipo_incidencia,
        prioridad=datos.prioridad,
        descripcion=datos.descripcion,
    )
    db.add(incidencia)
    notificar_roles(
        db,
        ["Coordinador de Practicas", "Administrador"],
        "Incidencia reportada por alumno",
        (
            f"Alumno: {_nombre_usuario(asignacion.alumno.usuario)}. Empresa: "
            f"{asignacion.empresa.nombre_empresa if asignacion.empresa else 'Sin empresa asignada'}. "
            f"Prioridad: {datos.prioridad}. Tipo: {datos.tipo_incidencia}."
        ),
    )
    db.commit()
    db.refresh(incidencia)
    return _incidencia_response(incidencia)


@router.get(
    "/unidad/me/seguimiento",
    dependencies=[Depends(requerir_roles(["Unidad Receptora", "Administrador"]))],
)
def obtener_mi_seguimiento_empresa(
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return obtener_seguimiento_empresa(id_empresa, db)


@router.post(
    "/unidad/me/evaluaciones",
    dependencies=[Depends(requerir_roles(["Unidad Receptora", "Administrador"]))],
)
def guardar_mi_evaluacion_empresa_alumno(
    datos: EvaluacionEmpresaAlumnoRequest,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return guardar_evaluacion_empresa_alumno(id_empresa, datos, db)


@router.post(
    "/unidad/me/incidencias/{id_asignacion}",
    dependencies=[Depends(requerir_roles(["Unidad Receptora", "Administrador"]))],
)
def crear_mi_incidencia_empresa(
    id_asignacion: int,
    datos: CrearIncidenciaRequest,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return crear_incidencia_empresa(id_empresa, id_asignacion, datos, db)


@router.get(
    "/unidad/{id_empresa}/seguimiento",
    dependencies=[Depends(requerir_empresa_actual_o_roles(["Administrador"]))],
)
def obtener_seguimiento_empresa(id_empresa: int, db: Session = Depends(obtener_db)):
    asignaciones = _asignaciones_empresa(db, id_empresa)
    alumnos = []
    for asignacion in asignaciones:
        evaluacion = (
            db.query(EvaluacionModel)
            .filter(
                EvaluacionModel.id_asignacion == asignacion.id_asignacion,
                EvaluacionModel.tipo_evaluacion == "Empresa",
            )
            .first()
        )
        incidencias = (
            db.query(IncidenciaPracticaModel)
            .filter(IncidenciaPracticaModel.id_asignacion == asignacion.id_asignacion)
            .count()
        )
        alumnos.append(
            {
                **_asignacion_response(asignacion),
                **_estado_cierre(db, asignacion),
                "evaluacion_alumno": _evaluacion_empresa_alumno_response(evaluacion),
                "incidencias": incidencias,
            }
        )
    return {
        "resumen": {
            "total": len(alumnos),
            "evaluados": sum(1 for alumno in alumnos if alumno["evaluacion_alumno"] is not None),
            "pendientes": sum(1 for alumno in alumnos if alumno["evaluacion_alumno"] is None),
        },
        "alumnos": alumnos,
    }


@router.post(
    "/unidad/{id_empresa}/evaluaciones",
    dependencies=[Depends(requerir_empresa_actual_o_roles(["Administrador"]))],
)
def guardar_evaluacion_empresa_alumno(
    id_empresa: int,
    datos: EvaluacionEmpresaAlumnoRequest,
    db: Session = Depends(obtener_db),
):
    asignacion = (
        db.query(AsignacionModel)
        .options(joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario), joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera), joinedload(AsignacionModel.empresa), joinedload(AsignacionModel.vacante))
        .filter(
            AsignacionModel.id_asignacion == datos.id_asignacion,
            AsignacionModel.id_empresa == id_empresa,
        )
        .first()
    )
    if asignacion is None:
        raise HTTPException(status_code=404, detail="Asignacion no encontrada para esta empresa")
    cierre = _estado_cierre(db, asignacion)
    if not cierre["puede_evaluar"]:
        raise HTTPException(status_code=400, detail=cierre["motivo_bloqueo"])

    responsable = (
        db.query(ResponsableEmpresaModel)
        .filter(ResponsableEmpresaModel.id_empresa == id_empresa)
        .first()
    )
    if responsable is None:
        raise HTTPException(status_code=400, detail="La empresa no tiene responsable registrado")

    evaluacion = (
        db.query(EvaluacionModel)
        .filter(
            EvaluacionModel.id_asignacion == asignacion.id_asignacion,
            EvaluacionModel.tipo_evaluacion == "Empresa",
        )
        .first()
    )
    if evaluacion is None:
        evaluacion = EvaluacionModel(
            id_asignacion=asignacion.id_asignacion,
            id_usuario_evaluador=responsable.id_usuario,
            tipo_evaluacion="Empresa",
            calificacion=datos.calificacion,
            comentarios=datos.comentarios,
            fecha_evaluacion=date.today(),
        )
        db.add(evaluacion)
    else:
        evaluacion.id_usuario_evaluador = responsable.id_usuario
        evaluacion.calificacion = datos.calificacion
        evaluacion.comentarios = datos.comentarios
        evaluacion.fecha_evaluacion = date.today()
    crear_notificacion(
        db,
        asignacion.alumno.id_usuario if asignacion.alumno else None,
        "Evaluacion de empresa registrada",
        "La unidad receptora registro tu evaluacion final.",
    )
    db.commit()
    db.refresh(evaluacion)
    return _evaluacion_empresa_alumno_response(evaluacion)


@router.post(
    "/unidad/{id_empresa}/incidencias/{id_asignacion}",
    dependencies=[Depends(requerir_empresa_actual_o_roles(["Administrador"]))],
)
def crear_incidencia_empresa(
    id_empresa: int,
    id_asignacion: int,
    datos: CrearIncidenciaRequest,
    db: Session = Depends(obtener_db),
):
    asignacion = (
        db.query(AsignacionModel)
        .filter(AsignacionModel.id_asignacion == id_asignacion, AsignacionModel.id_empresa == id_empresa)
        .first()
    )
    if asignacion is None:
        raise HTTPException(status_code=404, detail="Asignacion no encontrada para esta empresa")
    responsable = db.query(ResponsableEmpresaModel).filter(ResponsableEmpresaModel.id_empresa == id_empresa).first()
    if responsable is None:
        raise HTTPException(status_code=400, detail="La empresa no tiene responsable registrado")
    if datos.prioridad not in {"Baja", "Media", "Alta"}:
        raise HTTPException(status_code=400, detail="Prioridad no valida")
    incidencia = IncidenciaPracticaModel(
        id_asignacion=id_asignacion,
        id_usuario_reportante=responsable.id_usuario,
        reportante="Empresa",
        tipo_incidencia=datos.tipo_incidencia,
        prioridad=datos.prioridad,
        descripcion=datos.descripcion,
    )
    db.add(incidencia)
    crear_notificacion(
        db,
        asignacion.alumno.id_usuario if asignacion.alumno else None,
        "Incidencia registrada por la empresa",
        f"La unidad receptora registro una incidencia {datos.prioridad.lower()} en tu seguimiento.",
    )
    notificar_roles(
        db,
        ["Coordinador de Practicas", "Administrador"],
        "Incidencia reportada por empresa",
        (
            f"Alumno: {_nombre_usuario(asignacion.alumno.usuario) if asignacion.alumno else 'Sin alumno'}. "
            f"Empresa: {asignacion.empresa.nombre_empresa if asignacion.empresa else 'Sin empresa asignada'}. "
            f"Prioridad: {datos.prioridad}. Tipo: {datos.tipo_incidencia}."
        ),
    )
    db.commit()
    db.refresh(incidencia)
    return _incidencia_response(incidencia)


@router.get(
    "/coordinador/incidencias",
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)
def listar_incidencias_coordinador(db: Session = Depends(obtener_db)):
    incidencias = (
        db.query(IncidenciaPracticaModel)
        .options(joinedload(IncidenciaPracticaModel.asignacion).joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario), joinedload(IncidenciaPracticaModel.asignacion).joinedload(AsignacionModel.empresa))
        .order_by(IncidenciaPracticaModel.fecha_reporte.desc())
        .all()
    )
    return {
        "resumen": {
            "total": len(incidencias),
            "abiertas": sum(1 for item in incidencias if item.estado == "Abierta"),
            "seguimiento": sum(1 for item in incidencias if item.estado == "En seguimiento"),
            "resueltas": sum(1 for item in incidencias if item.estado in {"Resuelta", "Cerrada"}),
        },
        "incidencias": [_incidencia_response(item) for item in incidencias],
    }


@router.patch(
    "/coordinador/incidencias/{id_incidencia}",
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)
def actualizar_incidencia_coordinador(
    id_incidencia: int,
    datos: ActualizarIncidenciaRequest,
    db: Session = Depends(obtener_db),
):
    if datos.estado not in {"Abierta", "En seguimiento", "Resuelta", "Cerrada"}:
        raise HTTPException(status_code=400, detail="Estado no valido")
    incidencia = db.query(IncidenciaPracticaModel).filter(IncidenciaPracticaModel.id_incidencia == id_incidencia).first()
    if incidencia is None:
        raise HTTPException(status_code=404, detail="Incidencia no encontrada")
    incidencia.estado = datos.estado
    incidencia.respuesta_coordinacion = datos.respuesta_coordinacion
    crear_notificacion(
        db,
        incidencia.id_usuario_reportante,
        f"Incidencia {datos.estado.lower()}",
        "Coordinacion actualizo una incidencia reportada."
        + (f" Respuesta: {datos.respuesta_coordinacion}" if datos.respuesta_coordinacion else ""),
    )
    alumno = incidencia.asignacion.alumno if incidencia.asignacion else None
    if alumno and alumno.id_usuario != incidencia.id_usuario_reportante:
        crear_notificacion(
            db,
            alumno.id_usuario,
            f"Incidencia {datos.estado.lower()}",
            "Coordinacion actualizo una incidencia relacionada con tu practica.",
        )
    db.commit()
    db.refresh(incidencia)
    return _incidencia_response(incidencia)
