from __future__ import annotations

from datetime import date

from sqlalchemy.orm import Session

from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.empresa import EmpresaModel


def convenio_esta_vigente(convenio: ConvenioModel | None, hoy: date | None = None) -> bool:
    if convenio is None:
        return False
    fecha = hoy or date.today()
    return (
        convenio.es_actual
        and convenio.estado_convenio == "Vigente"
        and convenio.fecha_inicio <= fecha <= convenio.fecha_fin
    )


def obtener_convenio_actual(db: Session, id_empresa: int) -> ConvenioModel | None:
    return (
        db.query(ConvenioModel)
        .filter(
            ConvenioModel.id_empresa == id_empresa,
            ConvenioModel.es_actual.is_(True),
        )
        .order_by(ConvenioModel.id_convenio.desc())
        .first()
    )


def obtener_convenio_vigente(
    db: Session,
    id_empresa: int,
    hoy: date | None = None,
) -> ConvenioModel | None:
    fecha = hoy or date.today()
    return (
        db.query(ConvenioModel)
        .filter(
            ConvenioModel.id_empresa == id_empresa,
            ConvenioModel.es_actual.is_(True),
            ConvenioModel.estado_convenio == "Vigente",
            ConvenioModel.fecha_inicio <= fecha,
            ConvenioModel.fecha_fin >= fecha,
        )
        .order_by(ConvenioModel.id_convenio.desc())
        .first()
    )


def activar_convenio_actual(
    db: Session,
    empresa: EmpresaModel,
    convenio: ConvenioModel,
    *,
    fecha_inicio: date,
    fecha_fin: date,
    documento_convenio: str | None,
) -> ConvenioModel:
    """Activa exactamente un convenio y deja los anteriores como historicos.

    El estado ``Vencido`` tambien se usa para un convenio sustituido porque el
    esquema heredado no incluye un estado ``Sustituido``. Se conservan sus
    fechas, archivo y version para mantener el historial.
    """

    anteriores = (
        db.query(ConvenioModel)
        .filter(
            ConvenioModel.id_empresa == empresa.id_empresa,
            ConvenioModel.id_convenio != convenio.id_convenio,
        )
        .with_for_update()
        .all()
    )
    for anterior in anteriores:
        anterior.es_actual = False
        anterior.renovacion_solicitada = False
        if anterior.estado_convenio == "Vigente":
            anterior.estado_convenio = "Vencido"

    convenio.fecha_inicio = fecha_inicio
    convenio.fecha_fin = fecha_fin
    convenio.documento_convenio = documento_convenio
    convenio.es_actual = True
    convenio.renovacion_solicitada = False
    convenio.estado_convenio = "Vigente"

    # Un convenio aprobado es la fuente de verdad del tipo de tramite. Esto
    # repara registros heredados que quedaron en NULL o Vinculacion.
    empresa.tipo_tramite = "Convenio"
    return convenio
