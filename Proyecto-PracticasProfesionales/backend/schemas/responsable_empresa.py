from pydantic import BaseModel
from typing import Optional


class ResponsableEmpresaCreate(BaseModel):
    id_empresa: int
    nombre_completo: Optional[str] = None
    cargo: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None


class ResponsableEmpresaUpdate(BaseModel):
    nombre_completo: Optional[str] = None
    cargo: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None


class ResponsableEmpresaResponse(BaseModel):
    id_responsable: int
    id_empresa: int
    nombre_completo: Optional[str] = None
    cargo: Optional[str] = None
    correo: Optional[str] = None
    telefono: Optional[str] = None

    class Config:
        from_attributes = True