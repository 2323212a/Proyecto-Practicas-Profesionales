from __future__ import annotations
from dataclasses import dataclass


@dataclass
class Vacante:
    id_vacante: int | None
    id_empresa: int
    id_convocatoria: int
    id_tipo_practica: int
    titulo: str
    cupos: int
    periodo: str
    estado_vacante: str
    descripcion: str | None = None
    actividades: str | None = None
    requisitos: str | None = None
    observaciones: str | None = None
