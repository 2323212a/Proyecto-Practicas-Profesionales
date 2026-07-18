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
class PersonalInterno:
    id_personal: int | None
    id_usuario: int
    nombre: str
    apellido_paterno: str
    apellido_materno: str | None
    departamento: str | None
    cargo: str | None
    telefono: str | None


@dataclass(frozen=True)
class ResponsableEmpresa:
    id_responsable: int | None
    id_empresa: int
    id_usuario: int
    cargo: str | None
    telefono: str | None
