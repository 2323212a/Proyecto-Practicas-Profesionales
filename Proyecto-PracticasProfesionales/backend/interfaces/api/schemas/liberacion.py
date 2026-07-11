from __future__ import annotations
from datetime import date

from pydantic import BaseModel, ConfigDict


class LiberacionCreate(BaseModel):
    id_asignacion: int
    fecha_liberacion: date | None = None
    documento_liberacion: str | None = None
    estado_liberacion: str = "Pendiente"
    observaciones: str | None = None


class LiberacionUpdate(BaseModel):
    fecha_liberacion: date | None = None
    documento_liberacion: str | None = None
    estado_liberacion: str | None = None
    observaciones: str | None = None


class LiberacionResponse(BaseModel):
    id_liberacion: int
    id_asignacion: int
    fecha_liberacion: date | None = None
    documento_liberacion: str | None = None
    estado_liberacion: str
    observaciones: str | None = None

    model_config = ConfigDict(from_attributes=True)
