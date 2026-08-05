from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field


class VacanteCreate(BaseModel):
    id_empresa: int
    id_convocatoria: int
    id_tipo_practica: int
    titulo: str
    descripcion: str | None = None
    actividades: str | None = None
    requisitos: str | None = None
    cupos: int = Field(ge=1)
    observaciones: str | None = None


class VacanteUpdate(BaseModel):
    id_convocatoria: int | None = None
    id_tipo_practica: int | None = None
    titulo: str | None = None
    descripcion: str | None = None
    actividades: str | None = None
    requisitos: str | None = None
    cupos: int | None = Field(default=None, ge=1)
    estado_vacante: str | None = None
    observaciones: str | None = None


class VacanteResponse(BaseModel):
    id_vacante: int
    id_empresa: int
    id_convocatoria: int
    id_tipo_practica: int
    titulo: str
    descripcion: str | None = None
    actividades: str | None = None
    requisitos: str | None = None
    cupos: int
    periodo: str
    estado_vacante: str
    observaciones: str | None = None

    model_config = ConfigDict(from_attributes=True)
