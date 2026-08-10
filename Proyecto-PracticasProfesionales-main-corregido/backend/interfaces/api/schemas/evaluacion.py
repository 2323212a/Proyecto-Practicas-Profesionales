from __future__ import annotations
from datetime import date
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class EvaluacionCreate(BaseModel):
    id_asignacion: int
    id_usuario_evaluador: int
    tipo_evaluacion: str
    calificacion: Decimal = Field(ge=0, le=100)
    comentarios: str | None = None
    fecha_evaluacion: date


class EvaluacionUpdate(BaseModel):
    calificacion: Decimal | None = Field(default=None, ge=0, le=100)
    comentarios: str | None = None
    fecha_evaluacion: date | None = None


class EvaluacionResponse(BaseModel):
    id_evaluacion: int
    id_asignacion: int
    id_usuario_evaluador: int
    tipo_evaluacion: str
    calificacion: Decimal
    comentarios: str | None = None
    fecha_evaluacion: date

    model_config = ConfigDict(from_attributes=True)
