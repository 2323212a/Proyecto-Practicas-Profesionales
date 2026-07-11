from __future__ import annotations
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SeleccionEmpresaCreate(BaseModel):
    id_alumno: int
    id_empresa: int
    prioridad: int = Field(ge=1, le=10)


class SeleccionEmpresaUpdate(BaseModel):
    prioridad: int | None = Field(default=None, ge=1, le=10)


class SeleccionEmpresaResponse(BaseModel):
    id_seleccion: int
    id_alumno: int
    id_empresa: int
    prioridad: int
    fecha_seleccion: datetime

    model_config = ConfigDict(from_attributes=True)
