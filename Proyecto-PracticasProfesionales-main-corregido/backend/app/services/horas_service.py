from __future__ import annotations
from fastapi import HTTPException

from domain.exceptions import BusinessRuleError
from domain.ports.repositories import HorasRepositoryPort
from domain.services.horas_rules import (
    validar_asignacion_permite_horas,
    validar_horas_editables,
)


class HorasService:
    def __init__(self, repository: HorasRepositoryPort):
        self.repository = repository

    def listar(self):
        return self.repository.listar()

    def obtener_por_id(self, id_horas: int):
        return self.repository.obtener_por_id(id_horas)

    def listar_por_asignacion(self, id_asignacion: int):
        self._validar_asignacion(id_asignacion, permitir_finalizada=True)
        return self.repository.listar_por_asignacion(id_asignacion)

    def crear(self, horas):
        self._validar_asignacion(horas.id_asignacion)
        nuevo_registro = self.repository.nuevo(horas.model_dump())
        return self.repository.crear(nuevo_registro)

    def actualizar(self, id_horas: int, datos):
        horas = self.obtener_por_id(id_horas)
        if horas is None:
            return None

        self._validar_horas_editables(horas.estado_horas)
        return self.repository.actualizar(horas, datos.model_dump(exclude_unset=True))

    def aprobar(self, id_horas: int):
        return self._cambiar_estado(id_horas, "Aprobada")

    def rechazar(self, id_horas: int, observaciones: str | None = None):
        horas = self._cambiar_estado(id_horas, "Rechazada")
        if horas and observaciones:
            horas.observaciones = observaciones
            self.repository.commit_refresh(horas)
        return horas

    def eliminar(self, id_horas: int):
        horas = self.obtener_por_id(id_horas)
        if horas is None:
            return None
        self._validar_horas_editables(horas.estado_horas)
        return self.repository.eliminar(horas)

    def _cambiar_estado(self, id_horas: int, estado: str):
        horas = self.obtener_por_id(id_horas)
        if horas is None:
            return None
        horas.estado_horas = estado
        return self.repository.commit_refresh(horas)

    def _validar_asignacion(self, id_asignacion: int, permitir_finalizada: bool = False):
        asignacion = self.repository.obtener_asignacion(id_asignacion)
        if asignacion is None:
            raise HTTPException(status_code=404, detail="Asignación no encontrada")
        try:
            validar_asignacion_permite_horas(
                asignacion.estado_asignacion,
                permitir_finalizada
            )
        except BusinessRuleError as exc:
            raise HTTPException(status_code=400, detail=exc.message) from exc

    def _validar_horas_editables(self, estado_horas: str):
        try:
            validar_horas_editables(estado_horas)
        except BusinessRuleError as exc:
            raise HTTPException(status_code=400, detail=exc.message) from exc
