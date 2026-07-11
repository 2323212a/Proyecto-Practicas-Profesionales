from __future__ import annotations
from datetime import date
from typing import Protocol, TypeVar


T = TypeVar("T")


class RepositoryPort(Protocol[T]):
    def listar(self) -> list[T]:
        ...

    def obtener_por_id(self, entity_id: int) -> T | None:
        ...

    def crear(self, entity: T) -> T:
        ...

    def actualizar(self, entity_id: int, entity: T) -> T | None:
        ...

    def eliminar(self, entity_id: int) -> T | None:
        ...


class UnitOfWorkPort(Protocol):
    def commit(self) -> None:
        ...

    def rollback(self) -> None:
        ...


class UsuarioRepositoryPort(Protocol):
    def listar(self):
        ...

    def obtener_por_id(self, entity_id: int):
        ...

    def obtener_por_correo(self, correo: str):
        ...

    def obtener_rol(self, id_rol: int):
        ...

    def nuevo(self, datos: dict):
        ...

    def crear(self, entity):
        ...

    def eliminar(self, entity):
        ...

    def commit_refresh(self, entity):
        ...


class PerfilRepositoryPort(Protocol):
    def obtener_usuario(self, id_usuario: int):
        ...

    def usuario_tiene_perfil(self, id_usuario: int):
        ...


class VacanteRepositoryPort(Protocol):
    def listar(self):
        ...

    def obtener_por_id(self, entity_id: int):
        ...

    def obtener_empresa(self, id_empresa: int):
        ...

    def obtener_carrera(self, id_carrera: int):
        ...

    def nuevo(self, datos: dict):
        ...

    def crear(self, entity):
        ...

    def actualizar(self, entity, cambios: dict):
        ...

    def eliminar(self, entity):
        ...


class AsignacionRepositoryPort(Protocol):
    def listar(self):
        ...

    def obtener_por_id(self, entity_id: int):
        ...

    def obtener_alumno(self, id_alumno: int):
        ...

    def obtener_convocatoria(self, id_convocatoria: int):
        ...

    def obtener_docente(self, id_docente: int):
        ...

    def obtener_empresa(self, id_empresa: int):
        ...

    def tiene_convenio_vigente(self, id_empresa: int, fecha: date) -> bool:
        ...

    def obtener_vacante(self, id_vacante: int):
        ...

    def obtener_por_alumno_convocatoria(self, id_alumno: int, id_convocatoria: int):
        ...

    def nuevo(self, datos: dict):
        ...

    def crear(self, entity):
        ...

    def actualizar(self, entity, cambios: dict):
        ...

    def eliminar(self, entity):
        ...

    def commit(self):
        ...

    def refresh(self, entity):
        ...

    def commit_refresh(self, entity):
        ...


class HorasRepositoryPort(Protocol):
    def listar(self):
        ...

    def obtener_por_id(self, entity_id: int):
        ...

    def listar_por_asignacion(self, id_asignacion: int):
        ...

    def obtener_asignacion(self, id_asignacion: int):
        ...

    def nuevo(self, datos: dict):
        ...

    def crear(self, entity):
        ...

    def actualizar(self, entity, cambios: dict):
        ...

    def eliminar(self, entity):
        ...

    def commit_refresh(self, entity):
        ...
