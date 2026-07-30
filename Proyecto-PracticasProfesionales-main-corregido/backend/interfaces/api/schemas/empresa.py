from __future__ import annotations
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr


TipoTramite = Literal["Convenio", "Vinculacion"]
EstadoEmpresa = Literal["Solicitante", "Pendiente", "Rechazada", "Activa", "Suspendida", "Inactiva"]


class EmpresaCreate(BaseModel):
    nombre_empresa: str
    rfc: str | None = None
    giro: str | None = None
    domicilio: str | None = None
    telefono: str | None = None
    correo_contacto: EmailStr | None = None
    tipo_tramite: TipoTramite
    id_tipo_unidad_receptora: int | None = None
    estado_empresa: EstadoEmpresa = "Pendiente"


class EmpresaUpdate(BaseModel):
    nombre_empresa: str | None = None
    rfc: str | None = None
    giro: str | None = None
    domicilio: str | None = None
    telefono: str | None = None
    correo_contacto: EmailStr | None = None
    tipo_tramite: TipoTramite | None = None
    id_tipo_unidad_receptora: int | None = None
    estado_empresa: EstadoEmpresa | None = None


class EmpresaResponse(BaseModel):
    id_empresa: int
    nombre_empresa: str
    rfc: str | None = None
    giro: str | None = None
    domicilio: str | None = None
    telefono: str | None = None
    correo_contacto: str | None = None
    estado_empresa: str
    tipo_tramite: str | None = None
    id_tipo_unidad_receptora: int | None = None

    model_config = ConfigDict(from_attributes=True)
