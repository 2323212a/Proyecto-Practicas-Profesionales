from __future__ import annotations
from datetime import date

from pydantic import BaseModel, ConfigDict


class ReporteCreate(BaseModel):
    id_asignacion: int
    titulo: str
    descripcion: str | None = None
    archivo: str
    fecha_entrega: date
    estado_reporte: str = "Pendiente"


class ReporteUpdate(BaseModel):
    titulo: str | None = None
    descripcion: str | None = None
    archivo: str | None = None
    fecha_entrega: date | None = None
    estado_reporte: str | None = None


class ReporteResponse(BaseModel):
    id_reporte: int
    id_asignacion: int
    titulo: str
    descripcion: str | None = None
    archivo: str
    fecha_entrega: date
    estado_reporte: str

    model_config = ConfigDict(from_attributes=True)
