from __future__ import annotations
from pydantic import BaseModel, ConfigDict


class ResponsableEmpresaCreate(BaseModel):
    id_empresa: int
    id_usuario: int
    cargo: str | None = None
    telefono: str | None = None


class ResponsableEmpresaUpdate(BaseModel):
    id_empresa: int | None = None
    cargo: str | None = None
    telefono: str | None = None


class ResponsableEmpresaResponse(BaseModel):
    id_responsable: int
    id_empresa: int
    id_usuario: int
    cargo: str | None = None
    telefono: str | None = None

    model_config = ConfigDict(from_attributes=True)
