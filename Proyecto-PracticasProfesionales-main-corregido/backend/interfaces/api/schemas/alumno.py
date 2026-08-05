from __future__ import annotations
from pydantic import BaseModel, ConfigDict, Field


class AlumnoCreate(BaseModel):
    id_usuario: int
    id_carrera: int
    matricula: str
    semestre: int | None = Field(default=None, ge=1, le=12)
    grupo: str | None = None
    creditos_aprobados: int = Field(default=0, ge=0)
    estado_alumno: str = "Activo"


class AlumnoResponse(BaseModel):
    id_alumno: int
    id_usuario: int
    id_carrera: int
    matricula: str
    semestre: int | None = None
    grupo: str | None = None
    creditos_aprobados: int
    estado_alumno: str

    model_config = ConfigDict(from_attributes=True)


class AlumnoUpdate(BaseModel):
    id_carrera: int | None = None
    matricula: str | None = None
    semestre: int | None = Field(default=None, ge=1, le=12)
    grupo: str | None = None
    creditos_aprobados: int | None = Field(default=None, ge=0)
    estado_alumno: str | None = None
