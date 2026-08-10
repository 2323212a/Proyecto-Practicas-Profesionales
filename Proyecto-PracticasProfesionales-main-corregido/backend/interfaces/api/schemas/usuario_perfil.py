from __future__ import annotations

from typing import Any

from pydantic import BaseModel, EmailStr, Field


class UsuarioPerfilResponse(BaseModel):
    tipo: str
    usuario: dict[str, Any] | None = None
    perfil: dict[str, Any] | None = None
    datos: dict[str, Any] | None = None


class UsuarioPerfilUpdate(BaseModel):
    nombre: str | None = None
    apellido_paterno: str | None = None
    apellido_materno: str | None = None
    correo: EmailStr | None = None
    id_carrera: int | None = None
    matricula: str | None = None
    semestre: int | None = Field(default=None, ge=1)
    grupo: str | None = None
    id_tipo_practica: int | None = None
    creditos_aprobados: int | None = Field(default=None, ge=0)
    estado_alumno: str | None = None
    departamento: str | None = None
    area: str | None = None
    cargo: str | None = None
    telefono: str | None = None
