from __future__ import annotations
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class ExpedienteCreate(BaseModel):
    id_alumno: int
    id_convocatoria: int
    estado_expediente: str = "Pendiente"


class ExpedienteUpdate(BaseModel):
    estado_expediente: str | None = None


class ExpedienteResponse(BaseModel):
    id_expediente: int
    id_alumno: int
    id_convocatoria: int
    estado_expediente: str
    fecha_creacion: datetime
    fecha_actualizacion: datetime

    model_config = ConfigDict(from_attributes=True)
