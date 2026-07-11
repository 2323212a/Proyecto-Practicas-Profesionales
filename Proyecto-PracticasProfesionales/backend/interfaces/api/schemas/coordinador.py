from __future__ import annotations
from pydantic import BaseModel, ConfigDict


class CoordinadorCreate(BaseModel):
    id_usuario: int
    area: str | None = None
    departamento: str | None = None


class CoordinadorUpdate(BaseModel):
    area: str | None = None
    departamento: str | None = None


class CoordinadorResponse(BaseModel):
    id_coordinador: int
    id_usuario: int
    area: str | None = None
    departamento: str | None = None

    model_config = ConfigDict(from_attributes=True)
