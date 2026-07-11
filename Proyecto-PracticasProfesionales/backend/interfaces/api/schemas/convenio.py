from __future__ import annotations
from datetime import date

from pydantic import BaseModel, ConfigDict


class ConvenioCreate(BaseModel):
    id_empresa: int
    fecha_inicio: date
    fecha_fin: date
    documento_convenio: str | None = None
    estado_convenio: str = "Pendiente"


class ConvenioUpdate(BaseModel):
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    documento_convenio: str | None = None
    estado_convenio: str | None = None


class ConvenioResponse(BaseModel):
    id_convenio: int
    id_empresa: int
    fecha_inicio: date
    fecha_fin: date
    documento_convenio: str | None = None
    estado_convenio: str

    model_config = ConfigDict(from_attributes=True)
