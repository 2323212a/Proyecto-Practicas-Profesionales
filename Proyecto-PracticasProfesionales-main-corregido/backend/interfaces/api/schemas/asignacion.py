from __future__ import annotations
from datetime import date

from pydantic import BaseModel, ConfigDict


class AsignacionCreate(BaseModel):
    id_alumno: int
    id_empresa: int
    id_vacante: int
    id_convocatoria: int
    id_tipo_practica: int
    id_asesor: int | None = None
    fecha_asignacion: date
    estado_asignacion: str = "Activa"
    tipo_asignacion: str = "Normal"


class AsignacionUpdate(BaseModel):
    id_asesor: int | None = None
    fecha_asignacion: date | None = None
    estado_asignacion: str | None = None
    tipo_asignacion: str | None = None


class AsignarAsesorRequest(BaseModel):
    id_asesor: int


class AsignacionResponse(BaseModel):
    id_asignacion: int
    id_alumno: int
    id_empresa: int
    id_vacante: int
    id_convocatoria: int
    id_tipo_practica: int
    id_asesor: int | None = None
    fecha_asignacion: date
    estado_asignacion: str
    tipo_asignacion: str

    model_config = ConfigDict(from_attributes=True)
