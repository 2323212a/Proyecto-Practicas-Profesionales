from __future__ import annotations
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SeleccionEmpresaCreate(BaseModel):
    id_alumno: int
    id_empresa: int
    prioridad: int = Field(ge=1, le=10)


class SeleccionEmpresaUpdate(BaseModel):
    prioridad: int | None = Field(default=None, ge=1, le=10)
    estado_seleccion: str | None = None
    observaciones: str | None = None


class SeleccionEmpresaResponse(BaseModel):
    id_seleccion: int
    id_alumno: int
    id_empresa: int
    id_vacante: int | None = None
    prioridad: int
    estado_seleccion: str
    observaciones: str | None = None
    fecha_seleccion: datetime
    fecha_revision: datetime | None = None
    id_usuario_revisor: int | None = None

    model_config = ConfigDict(from_attributes=True)
