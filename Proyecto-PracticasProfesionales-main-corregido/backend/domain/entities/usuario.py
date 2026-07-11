from __future__ import annotations
from dataclasses import dataclass
from datetime import datetime


@dataclass(frozen=True)
class Usuario:
    id_usuario: int | None
    id_rol: int
    nombre: str
    apellido_paterno: str | None
    apellido_materno: str | None
    correo: str
    estado: str = "Activo"
    fecha_registro: datetime | None = None
