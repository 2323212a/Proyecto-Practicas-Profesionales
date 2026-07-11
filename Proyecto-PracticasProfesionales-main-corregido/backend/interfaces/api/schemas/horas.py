from __future__ import annotations
from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class HorasCreate(BaseModel):
    id_asignacion: int
    fecha: date
    horas_realizadas: Decimal = Field(gt=0)
    actividad: str
    evidencia_archivo: str | None = None
    estado_horas: str = "Pendiente"
    observaciones: str | None = None


class HorasUpdate(BaseModel):
    fecha: date | None = None
    horas_realizadas: Decimal | None = Field(default=None, gt=0)
    actividad: str | None = None
    evidencia_archivo: str | None = None
    estado_horas: str | None = None
    observaciones: str | None = None


class HorasResponse(BaseModel):
    id_horas: int
    id_asignacion: int
    fecha: date
    horas_realizadas: Decimal
    actividad: str
    evidencia_archivo: str | None = None
    estado_horas: str
    observaciones: str | None = None
    fecha_registro: datetime

    model_config = ConfigDict(from_attributes=True)
