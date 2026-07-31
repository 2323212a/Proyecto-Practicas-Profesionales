from __future__ import annotations

from datetime import date, timedelta

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

BLOQUES_CONVOCATORIA = (
    {
        "nombre": "Registro y preparación",
        "descripcion": "Registro de empresas, carga documental y validación inicial.",
        "inicio_campo": "fecha_inicio_empresas",
        "cierre_campo": "fecha_cierre_validacion",
        "etapas": ("empresas", "documentos", "validacion"),
    },
    {
        "nombre": "Selección y asignación",
        "descripcion": "Selección de vacantes, asignación formal y atención de alumnos rezagados.",
        "inicio_campo": "fecha_inicio_seleccion",
        "cierre_campo": "fecha_cierre_asignacion",
        "etapas": ("seleccion", "asignacion"),
    },
    {
        "nombre": "Desarrollo de prácticas",
        "descripcion": "Prácticas, horas, reportes, seguimiento, incidencias y reasignaciones extraordinarias.",
        "inicio_campo": "fecha_inicio_practicas",
        "cierre_campo": "fecha_cierre_practicas",
        "etapas": ("practicas",),
    },
    {
        "nombre": "Cierre",
        "descripcion": "Evaluaciones, liberación y cierre administrativo.",
        "inicio_campo": "fecha_inicio_cierre",
        "cierre_campo": "fecha_cierre_cierre",
        "etapas": ("cierre",),
    },
)


def obtener_bloques_convocatoria(convocatoria) -> list[dict]:
    """Proyecta las fechas existentes de la convocatoria en los cuatro bloques visuales."""
    return [
        {
            **bloque,
            "inicio": getattr(convocatoria, bloque["inicio_campo"], None),
            "cierre": getattr(convocatoria, bloque["cierre_campo"], None),
        }
        for bloque in BLOQUES_CONVOCATORIA
    ]


def validar_bloques_basicos(convocatoria) -> None:
    """Valida los límites de los cuatro bloques sin requerir columnas nuevas."""
    bloques = obtener_bloques_convocatoria(convocatoria)
    if any(bloque["inicio"] is None or bloque["cierre"] is None for bloque in bloques):
        raise HTTPException(status_code=409, detail="La convocatoria no tiene calendario completo.")
    for bloque in bloques:
        if bloque["inicio"] > bloque["cierre"]:
            raise HTTPException(status_code=400, detail="El calendario de la convocatoria no respeta el flujo de bloques.")
    for anterior, siguiente in zip(bloques, bloques[1:]):
        if siguiente["inicio"] < anterior["cierre"]:
            raise HTTPException(status_code=400, detail="El calendario de la convocatoria no respeta el flujo de bloques.")


def distribuir_fechas_bloque_basico(
    inicio: date,
    cierre: date,
    etapas: tuple[str, ...],
) -> dict[str, date]:
    """Distribuye un rango en orden; en rangos cortos las subetapas pueden compartir fecha."""
    if inicio > cierre:
        raise HTTPException(status_code=400, detail="El cierre del bloque no puede ser anterior al inicio.")
    if not etapas or any(etapa not in ETAPAS_CON_FECHAS for etapa in etapas):
        raise HTTPException(status_code=400, detail="El bloque contiene etapas no válidas.")

    dias = (cierre - inicio).days
    cantidad = len(etapas)
    fechas: dict[str, date] = {}
    for indice, etapa in enumerate(etapas):
        campo_inicio, campo_cierre = ETAPAS_CON_FECHAS[etapa]
        fechas[campo_inicio] = inicio + timedelta(days=(indice * dias) // cantidad)
        fechas[campo_cierre] = inicio + timedelta(days=((indice + 1) * dias) // cantidad)
    return fechas


def validar_calendario_completo(convocatoria) -> None:
    if any(getattr(convocatoria, campo, None) is None for campo in FECHAS_OBLIGATORIAS):
        raise HTTPException(status_code=409, detail="La convocatoria no tiene calendario completo.")


def validar_flujo_fechas(convocatoria) -> None:
    validar_calendario_completo(convocatoria)
    validar_bloques_basicos(convocatoria)

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
        raise HTTPException(
            status_code=409,
            detail=f"Ya existe una convocatoria {convocatoria.tipo_periodo} activa que se cruza con este periodo.",
        )


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
