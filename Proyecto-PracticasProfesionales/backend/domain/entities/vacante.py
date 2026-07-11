from __future__ import annotations
from dataclasses import dataclass


@dataclass
class Vacante:
    id_vacante: int | None
    id_empresa: int
    id_carrera: int
    titulo: str
    modalidad: str
    cupo_total: int
    cupo_disponible: int
    estado_vacante: str
    descripcion: str | None = None
    horario: str | None = None
