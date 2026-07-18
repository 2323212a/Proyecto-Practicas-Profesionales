from __future__ import annotations

from datetime import datetime

from pydantic import BaseModel, ConfigDict


class BitacoraAuditoriaCreate(BaseModel):
    id_usuario: int | None = None
    accion: str
    modulo: str
    descripcion: str | None = None
    entidad: str | None = None
    id_entidad: int | None = None
    ip: str | None = None
    user_agent: str | None = None


class BitacoraAuditoriaResponse(BaseModel):
    id_bitacora: int
    id_usuario: int | None = None
    usuario_correo: str | None = None
    accion: str
    modulo: str
    descripcion: str | None = None
    entidad: str | None = None
    id_entidad: int | None = None
    fecha: datetime
    ip: str | None = None
    user_agent: str | None = None

    model_config = ConfigDict(from_attributes=True)
