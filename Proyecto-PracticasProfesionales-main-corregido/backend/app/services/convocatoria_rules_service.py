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

# Ya no se exige calendario completo de 8 subfases.
# Para operar solo se requiere periodo general.
FECHAS_OBLIGATORIAS = [
    "fecha_inicio_general",
    "fecha_cierre_general",
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
    """
    Proyecta las fechas existentes de la convocatoria en los cuatro bloques visuales.
    No valida fases rígidas.
    """
    return [
        {
            **bloque,
            "inicio": getattr(convocatoria, bloque["inicio_campo"], None),
            "cierre": getattr(convocatoria, bloque["cierre_campo"], None),
        }
        for bloque in BLOQUES_CONVOCATORIA
    ]


def validar_bloques_basicos(convocatoria) -> None:
    """
    Compatibilidad histórica.

    Los bloques ya no imponen restricciones operativas.
    La validación real mínima se limita al periodo general.
    """
    validar_calendario_completo(convocatoria)


def distribuir_fechas_bloque_basico(
    inicio: date,
    cierre: date,
    etapas: tuple[str, ...],
) -> dict[str, date]:
    """
    Distribuye un rango en las subetapas internas existentes.

    Esto se mantiene solo para compatibilidad con columnas antiguas/internas.
    En la UI no deben mostrarse las 8 fases como calendario principal.
    """
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
    """
    Valida únicamente el periodo general.

    Las fechas internas por bloque son informativas/operativas, pero no deben
    bloquear todo el flujo como antes sucedía con las 8 subfases.
    """
    if convocatoria.fecha_inicio_general is None or convocatoria.fecha_cierre_general is None:
        raise HTTPException(status_code=409, detail="La convocatoria no tiene periodo general configurado.")

    if convocatoria.fecha_inicio_general > convocatoria.fecha_cierre_general:
        raise HTTPException(status_code=400, detail="La fecha de cierre general debe ser posterior al inicio.")


def validar_flujo_fechas(convocatoria) -> None:
    """
    Compatibilidad con código existente.

    Antes esta función podía validar flujo completo de subfases.
    Ahora solo valida el periodo general.
    """
    validar_calendario_completo(convocatoria)


def validar_convocatoria_operativa(convocatoria) -> None:
    """
    Valida que la convocatoria sea operativa.

    No bloquea por subfase ni por fecha actual.
    La disponibilidad real se controla por:
    - estado Activa/Inactiva/Cerrada
    - reglas funcionales del módulo correspondiente
    - cupos, expediente, empresa, convenio, vacantes, etc.
    """
    if convocatoria.estado != "Activa":
        raise HTTPException(status_code=404, detail="Convocatoria activa no encontrada.")

    if convocatoria.tipo_periodo not in {"Semestral", "Cuatrimestral"}:
        raise HTTPException(status_code=400, detail="Tipo de periodo no válido.")

    validar_calendario_completo(convocatoria)


def validar_etapa_actual(convocatoria, etapa: str) -> None:
    """
    Compatibilidad: valida que la etapa exista, pero no bloquea por subfase.

    Las fechas internas sirven para mostrar calendario por bloques, no para
    impedir consultar, revisar o avanzar procesos.
    """
    if etapa not in ETAPAS_CON_FECHAS:
        raise HTTPException(status_code=400, detail="Etapa de convocatoria no válida.")

    validar_convocatoria_operativa(convocatoria)


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
    """
    Evita cruces solo entre convocatorias Activas del mismo tipo de periodo.

    Semestral puede cruzarse con Cuatrimestral.
    Inactiva o Cerrada no bloquean.
    """
    if convocatoria.estado != "Activa":
        return

    if convocatoria.fecha_inicio_general is None or convocatoria.fecha_cierre_general is None:
        raise HTTPException(status_code=409, detail="La convocatoria no tiene periodo general configurado.")

    if convocatoria.fecha_inicio_general > convocatoria.fecha_cierre_general:
        raise HTTPException(status_code=400, detail="La fecha de cierre general debe ser posterior al inicio.")

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
    """
    Evita eliminar convocatorias que ya tienen procesos asociados.
    """
    modelos = [
        ExpedienteAlumnoModel,
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
    """
    Devuelve convocatorias activas compatibles con el periodo del alumno.

    No bloquea por subfase documental. El bloqueo real de selección/documentos
    debe vivir en los servicios específicos de alumno.
    """
    convocatorias = (
        db.query(ConvocatoriaModel)
        .filter(
            ConvocatoriaModel.estado == "Activa",
            ConvocatoriaModel.tipo_periodo == alumno.periodo_practica,
        )
        .order_by(ConvocatoriaModel.fecha_inicio_general.desc(), ConvocatoriaModel.id_convocatoria.desc())
        .all()
    )

    disponibles = []

    for convocatoria in convocatorias:
        try:
            validar_etapa_actual(convocatoria, "documentos")
        except HTTPException:
            continue

        existe_expediente = (
            db.query(ExpedienteAlumnoModel)
            .filter(
                ExpedienteAlumnoModel.id_alumno == alumno.id_alumno,
                ExpedienteAlumnoModel.id_convocatoria == convocatoria.id_convocatoria,
            )
            .first()
            is not None
        )

        if not existe_expediente:
            disponibles.append(convocatoria)

    return disponibles


def obtener_convocatorias_disponibles_para_empresa(db: Session, id_empresa: int) -> list[ConvocatoriaModel]:
    """
    Devuelve convocatorias activas donde la empresa todavía no tiene participación.

    No bloquea por subfase de empresas.
    """
    convocatorias = (
        db.query(ConvocatoriaModel)
        .filter(ConvocatoriaModel.estado == "Activa")
        .order_by(ConvocatoriaModel.fecha_inicio_general.desc(), ConvocatoriaModel.id_convocatoria.desc())
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