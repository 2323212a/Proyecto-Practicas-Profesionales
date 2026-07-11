from __future__ import annotations
from typing import Any

from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    correo: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    id_usuario: int
    id_rol: int
    rol: str | None = None
    nombre: str
    apellido_paterno: str | None = None
    apellido_materno: str | None = None
    nombre_completo: str
    correo: str
    perfil_tipo: str | None = None
    perfil: dict[str, Any] | None = None
