from __future__ import annotations
from dataclasses import dataclass


@dataclass(frozen=True)
class Empresa:
    id_empresa: int | None
    nombre_empresa: str
    rfc: str | None
    giro: str | None
    domicilio: str | None
    telefono: str | None
    correo_contacto: str | None
    estado_empresa: str
