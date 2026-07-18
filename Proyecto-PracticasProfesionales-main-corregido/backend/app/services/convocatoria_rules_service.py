from __future__ import annotations

from datetime import date

from fastapi import HTTPException
from sqlalchemy.orm import Session

from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.expediente import ExpedienteModel
from infrastructure.persistence.models.participacion_empresa_convocatoria import ParticipacionEmpresaConvocatoriaModel
from infrastructure.persistence.models.seleccion_empresa import SeleccionEmpresaModel
from infrastructure.persistence.models.vacante import VacanteModel


ETAPAS_CON_FECHAS = {
    "empresas": ("fecha_inicio_empresas", "fecha_cierre_empresas"),
    "documentos": ("fecha_inicio_documentos", "fecha_cierre_documentos"),
    "validacion": ("fecha_inicio_validacion", "fecha_cierre_validacion"),
    "seleccion": ("fecha_inicio_seleccion", "fecha_cierre_seleccion"),
    "asignacion": ("fecha_inicio_asignacion", "fecha_cierre_asignacion"),
    "practicas": ("fecha_inicio_practicas", "fecha_cierre_practicas"),
    "cierre": ("fecha_inicio_cierre", "fecha_cierre_cierre"),
}

FECHAS_OBLIGATORIAS = [
    "fecha_inicio_general",
    "fecha_cierre_general",
    *[campo for par in ETAPAS_CON_FECHAS.values() for campo in par],
]


def validar_calendario_completo(convocatoria) -> None:
    if any(getattr(convocatoria, campo, None) is None for campo in FECHAS_OBLIGATORIAS):
        raise HTTPException(status_code=409, detail="La convocatoria no tiene calendario completo.")


def validar_flujo_fechas(convocatoria) -> None:
    validar_calendario_completo(convocatoria)

    inicio_general = convocatoria.fecha_inicio_general
    cierre_general = convocatoria.fecha_cierre_general
    if inicio_general > cierre_general:
        raise HTTPException(status_code=400, detail="El calendario de la convocatoria no respeta el flujo de etapas.")

    reglas = [
        ("fecha_inicio_empresas", ">=", "fecha_inicio_general"),
        ("fecha_cierre_empresas", "<=", "fecha_cierre_general"),
        ("fecha_inicio_documentos", ">=", "fecha_inicio_general"),
        ("fecha_cierre_documentos", "<=", "fecha_cierre_general"),
        ("fecha_inicio_validacion", ">=", "fecha_inicio_documentos"),
        ("fecha_cierre_validacion", "<=", "fecha_cierre_general"),
        ("fecha_inicio_seleccion", ">=", "fecha_cierre_validacion"),
        ("fecha_cierre_seleccion", "<=", "fecha_cierre_general"),
        ("fecha_inicio_asignacion", ">=", "fecha_cierre_seleccion"),
        ("fecha_cierre_asignacion", "<=", "fecha_cierre_general"),
        ("fecha_inicio_practicas", ">=", "fecha_cierre_asignacion"),
        ("fecha_cierre_practicas", "<=", "fecha_cierre_general"),
        ("fecha_inicio_cierre", ">=", "fecha_cierre_practicas"),
        ("fecha_cierre_cierre", "<=", "fecha_cierre_general"),
    ]
    for izquierda, operador, derecha in reglas:
        valor_izquierda = getattr(convocatoria, izquierda)
        valor_derecha = getattr(convocatoria, derecha)
        if operador == ">=" and valor_izquierda < valor_derecha:
            raise HTTPException(status_code=400, detail="El calendario de la convocatoria no respeta el flujo de etapas.")
        if operador == "<=" and valor_izquierda > valor_derecha:
            raise HTTPException(status_code=400, detail="El calendario de la convocatoria no respeta el flujo de etapas.")

    for inicio, cierre in ETAPAS_CON_FECHAS.values():
        if getattr(convocatoria, inicio) > getattr(convocatoria, cierre):
            raise HTTPException(status_code=400, detail="El calendario de la convocatoria no respeta el flujo de etapas.")


def validar_convocatoria_operativa(convocatoria) -> None:
    if convocatoria.estado != "Activa":
        raise HTTPException(status_code=404, detail="Convocatoria activa no encontrada")
    if convocatoria.tipo_periodo not in {"Semestral", "Cuatrimestral"}:
        raise HTTPException(status_code=400, detail="Tipo de periodo no valido.")
    validar_flujo_fechas(convocatoria)


def validar_etapa_actual(convocatoria, etapa: str) -> None:
    validar_convocatoria_operativa(convocatoria)
    if etapa not in ETAPAS_CON_FECHAS:
        raise HTTPException(status_code=400, detail="Etapa de convocatoria no valida.")
    inicio_campo, cierre_campo = ETAPAS_CON_FECHAS[etapa]
    hoy = date.today()
    if hoy < getattr(convocatoria, inicio_campo):
        raise HTTPException(status_code=403, detail=f"La etapa de {etapa} aun no inicia.")
    if hoy > getattr(convocatoria, cierre_campo):
        raise HTTPException(status_code=403, detail=f"La etapa de {etapa} ya cerro.")


def esta_en_etapa(convocatoria, etapa: str) -> bool:
    try:
        validar_etapa_actual(convocatoria, etapa)
        return True
    except HTTPException:
        return False


def validar_sin_conflicto_activo(
    db: Session,
    convocatoria,
    id_convocatoria_ignorar: int | None = None,
) -> None:
    if convocatoria.estado != "Activa":
        return
    validar_convocatoria_operativa(convocatoria)
    query = db.query(ConvocatoriaModel).filter(
        ConvocatoriaModel.estado == "Activa",
        ConvocatoriaModel.tipo_periodo == convocatoria.tipo_periodo,
        ConvocatoriaModel.fecha_inicio_general <= convocatoria.fecha_cierre_general,
        ConvocatoriaModel.fecha_cierre_general >= convocatoria.fecha_inicio_general,
    )
    if id_convocatoria_ignorar is not None:
        query = query.filter(ConvocatoriaModel.id_convocatoria != id_convocatoria_ignorar)
    if query.first() is not None:
        raise HTTPException(status_code=409, detail="Ya existe una convocatoria activa que se traslapa con ese periodo.")


def validar_convocatoria_sin_dependencias(db: Session, id_convocatoria: int) -> None:
    modelos = [
        ExpedienteModel,
        ParticipacionEmpresaConvocatoriaModel,
        VacanteModel,
        SeleccionEmpresaModel,
        AsignacionModel,
    ]
    tiene_dependencias = any(
        db.query(modelo)
        .filter(modelo.id_convocatoria == id_convocatoria)
        .first()
        is not None
        for modelo in modelos
    )
    if tiene_dependencias:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar porque ya tiene procesos asociados. Puedes cerrarla o desactivarla.",
        )


def obtener_convocatorias_disponibles_para_alumno(db: Session, alumno: AlumnoModel) -> list[ConvocatoriaModel]:
    convocatorias = (
        db.query(ConvocatoriaModel)
        .filter(
            ConvocatoriaModel.estado == "Activa",
            ConvocatoriaModel.tipo_periodo == alumno.periodo_practica,
        )
        .order_by(ConvocatoriaModel.fecha_inicio_general.desc())
        .all()
    )
    disponibles = []
    for convocatoria in convocatorias:
        try:
            validar_etapa_actual(convocatoria, "documentos")
        except HTTPException:
            continue
        existe_expediente = (
            db.query(ExpedienteModel)
            .filter(
                ExpedienteModel.id_alumno == alumno.id_alumno,
                ExpedienteModel.id_convocatoria == convocatoria.id_convocatoria,
            )
            .first()
            is not None
        )
        if not existe_expediente:
            disponibles.append(convocatoria)
    return disponibles


def obtener_convocatorias_disponibles_para_empresa(db: Session, id_empresa: int) -> list[ConvocatoriaModel]:
    convocatorias = (
        db.query(ConvocatoriaModel)
        .filter(ConvocatoriaModel.estado == "Activa")
        .order_by(ConvocatoriaModel.fecha_inicio_general.desc())
        .all()
    )
    disponibles = []
    for convocatoria in convocatorias:
        try:
            validar_etapa_actual(convocatoria, "empresas")
        except HTTPException:
            continue
        participacion = (
            db.query(ParticipacionEmpresaConvocatoriaModel)
            .filter(
                ParticipacionEmpresaConvocatoriaModel.id_empresa == id_empresa,
                ParticipacionEmpresaConvocatoriaModel.id_convocatoria == convocatoria.id_convocatoria,
            )
            .first()
        )
        if participacion is None:
            disponibles.append(convocatoria)
    return disponibles
