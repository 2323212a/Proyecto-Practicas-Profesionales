from __future__ import annotations
from datetime import date

from pydantic import BaseModel, ConfigDict


class ConvenioCreate(BaseModel):
    id_empresa: int
    estado_convenio: str = "Pendiente"
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    es_actual: bool = True
    observaciones: str | None = None


class ConvenioUpdate(BaseModel):
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    es_actual: bool | None = None
    estado_convenio: str | None = None
    observaciones: str | None = None


class SolicitarRenovacionRequest(BaseModel):
    observaciones: str | None = None


class ConvenioResponse(BaseModel):
    id_convenio: int
    id_empresa: int
    estado_convenio: str
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    es_actual: bool
    observaciones: str | None = None

    model_config = ConfigDict(from_attributes=True)
