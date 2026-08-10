from __future__ import annotations
from dataclasses import dataclass
from datetime import date


@dataclass
class Asignacion:
    id_asignacion: int | None
    id_alumno: int
    id_empresa: int
    id_vacante: int
    id_convocatoria: int
    id_tipo_practica: int
    fecha_asignacion: date
    estado_asignacion: str
    tipo_asignacion: str
    id_asesor: int | None = None
