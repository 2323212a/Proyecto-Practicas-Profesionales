from pydantic import BaseModel
from typing import Optional


class EmpresaCreate(BaseModel):
    id_usuario: Optional[int] = None
    nombre_empresa: str
    rfc: Optional[str] = None
    giro: Optional[str] = None
    domicilio: Optional[str] = None
    telefono: Optional[str] = None
    correo_contacto: Optional[str] = None


class EmpresaUpdate(BaseModel):
    nombre_empresa: str
    rfc: Optional[str] = None
    giro: Optional[str] = None
    domicilio: Optional[str] = None
    telefono: Optional[str] = None
    correo_contacto: Optional[str] = None
    estado_empresa: Optional[str] = None


class EmpresaResponse(BaseModel):
    id_empresa: int
    id_usuario: Optional[int] = None
    nombre_empresa: str
    rfc: Optional[str] = None
    giro: Optional[str] = None
    domicilio: Optional[str] = None
    telefono: Optional[str] = None
    correo_contacto: Optional[str] = None
    estado_empresa: Optional[str] = None

    class Config:
        from_attributes = True