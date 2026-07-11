from __future__ import annotations
from pydantic import BaseModel, ConfigDict


class DocenteAsesorCreate(BaseModel):
    id_usuario: int
    departamento: str


class DocenteAsesorUpdate(BaseModel):
    departamento: str | None = None


class DocenteAsesorResponse(BaseModel):
    id_docente: int
    id_usuario: int
    departamento: str

    model_config = ConfigDict(from_attributes=True)
