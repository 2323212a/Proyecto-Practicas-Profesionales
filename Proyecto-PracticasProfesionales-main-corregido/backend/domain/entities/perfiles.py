from __future__ import annotations
from dataclasses import dataclass


@dataclass(frozen=True)
class Alumno:
    id_alumno: int | None
    id_usuario: int
    id_carrera: int
    matricula: str
    semestre: int | None
    grupo: str | None
    creditos_aprobados: int
    estado_alumno: str


@dataclass(frozen=True)
class DocenteAsesor:
    id_docente: int | None
    id_usuario: int
    departamento: str


@dataclass(frozen=True)
class Coordinador:
    id_coordinador: int | None
    id_usuario: int
    area: str | None
    departamento: str | None


@dataclass(frozen=True)
class ResponsableEmpresa:
    id_responsable: int | None
    id_empresa: int
    id_usuario: int
    cargo: str | None
    telefono: str | None
