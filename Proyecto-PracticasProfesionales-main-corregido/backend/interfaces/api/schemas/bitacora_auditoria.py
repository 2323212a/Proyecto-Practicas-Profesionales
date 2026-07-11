from __future__ import annotations
from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BitacoraAuditoriaCreate(BaseModel):
    id_usuario: int
    accion: str
    tabla_afectada: str
    detalles: str | None = None


class BitacoraAuditoriaResponse(BaseModel):
    id_bitacora: int
    id_usuario: int
    accion: str
    tabla_afectada: str
    fecha_accion: datetime
    detalles: str | None = None

    model_config = ConfigDict(from_attributes=True)
