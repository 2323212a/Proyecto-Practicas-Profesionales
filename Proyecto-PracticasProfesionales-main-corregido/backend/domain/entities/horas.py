from __future__ import annotations
from dataclasses import dataclass
from datetime import date, datetime
from decimal import Decimal


@dataclass
class Horas:
    id_horas: int | None
    id_asignacion: int
    fecha: date
    horas_realizadas: Decimal
    actividad: str
    estado_horas: str
    evidencia_archivo: str | None = None
    observaciones: str | None = None
    fecha_registro: datetime | None = None
