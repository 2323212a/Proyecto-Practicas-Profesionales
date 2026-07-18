from __future__ import annotations
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SeleccionEmpresaCreate(BaseModel):
    id_alumno: int
    id_convocatoria: int
    id_vacante: int
    prioridad: int = Field(ge=1, le=3)
    observaciones: str | None = None


class SeleccionEmpresaUpdate(BaseModel):
    prioridad: int | None = Field(default=None, ge=1, le=3)
    estado: str | None = None
    observaciones: str | None = None


class SeleccionEmpresaResponse(BaseModel):
    id_seleccion: int
    id_alumno: int
    id_empresa: int | None = None
    id_convocatoria: int
    id_vacante: int
    prioridad: int
    estado: str
    observaciones: str | None = None
    fecha_seleccion: datetime
    fecha_revision: datetime | None = None
    revisado_por: int | None = None

    model_config = ConfigDict(from_attributes=True)
