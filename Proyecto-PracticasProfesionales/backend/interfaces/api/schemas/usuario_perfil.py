from __future__ import annotations

from typing import Any

from pydantic import BaseModel


class UsuarioPerfilResponse(BaseModel):
    tipo: str
    datos: dict[str, Any] | None = None


class UsuarioPerfilUpdate(BaseModel):
    id_carrera: int | None = None
    matricula: str | None = None
    semestre: int | None = None
    grupo: str | None = None
    creditos_aprobados: int | None = None
    estado_alumno: str | None = None
    departamento: str | None = None
    area: str | None = None
    id_empresa: int | None = None
    cargo: str | None = None
    telefono: str | None = None
