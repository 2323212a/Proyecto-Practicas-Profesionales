from __future__ import annotations
from pydantic import BaseModel, ConfigDict, EmailStr


class EmpresaCreate(BaseModel):
    nombre_empresa: str
    rfc: str | None = None
    giro: str | None = None
    domicilio: str | None = None
    telefono: str | None = None
    correo_contacto: EmailStr | None = None
    estado_empresa: str = "Pendiente"


class EmpresaUpdate(BaseModel):
    nombre_empresa: str | None = None
    rfc: str | None = None
    giro: str | None = None
    domicilio: str | None = None
    telefono: str | None = None
    correo_contacto: EmailStr | None = None
    estado_empresa: str | None = None


class EmpresaResponse(BaseModel):
    id_empresa: int
    nombre_empresa: str
    rfc: str | None = None
    giro: str | None = None
    domicilio: str | None = None
    telefono: str | None = None
    correo_contacto: str | None = None
    estado_empresa: str

    model_config = ConfigDict(from_attributes=True)
