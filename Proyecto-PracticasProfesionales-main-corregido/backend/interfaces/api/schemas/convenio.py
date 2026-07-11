from __future__ import annotations
from datetime import date

from pydantic import BaseModel, ConfigDict


class ConvenioCreate(BaseModel):
    id_empresa: int
    fecha_inicio: date
    fecha_fin: date
    documento_convenio: str | None = None
    id_documento_empresa: int | None = None
    version: int = 1
    es_actual: bool = True
    renovacion_solicitada: bool = False
    estado_convenio: str = "Pendiente"


class ConvenioUpdate(BaseModel):
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    documento_convenio: str | None = None
    id_documento_empresa: int | None = None
    version: int | None = None
    es_actual: bool | None = None
    renovacion_solicitada: bool | None = None
    estado_convenio: str | None = None


class SolicitarRenovacionRequest(BaseModel):
    observaciones: str | None = None


class ConvenioResponse(BaseModel):
    id_convenio: int
    id_empresa: int
    fecha_inicio: date
    fecha_fin: date
    documento_convenio: str | None = None
    id_documento_empresa: int | None = None
    version: int
    es_actual: bool
    renovacion_solicitada: bool
    estado_convenio: str

    model_config = ConfigDict(from_attributes=True)
