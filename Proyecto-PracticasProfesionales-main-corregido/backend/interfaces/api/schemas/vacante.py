from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field


class VacanteCreate(BaseModel):
    id_empresa: int
    id_carrera: int
    titulo: str
    descripcion: str | None = None
    modalidad: str
    horario: str | None = None
    cupo_total: int = Field(ge=0)
    cupo_disponible: int = Field(ge=0)
    estado_vacante: str = "Activa"


class VacanteUpdate(BaseModel):
    id_carrera: int | None = None
    titulo: str | None = None
    descripcion: str | None = None
    modalidad: str | None = None
    horario: str | None = None
    cupo_total: int | None = Field(default=None, ge=0)
    cupo_disponible: int | None = Field(default=None, ge=0)
    estado_vacante: str | None = None


class VacanteResponse(BaseModel):
    id_vacante: int
    id_empresa: int
    id_carrera: int
    titulo: str
    descripcion: str | None = None
    modalidad: str
    horario: str | None = None
    cupo_total: int
    cupo_disponible: int
    estado_vacante: str

    model_config = ConfigDict(from_attributes=True)
