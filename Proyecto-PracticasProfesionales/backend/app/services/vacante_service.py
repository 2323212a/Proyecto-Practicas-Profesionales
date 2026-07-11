from fastapi import HTTPException

from domain.entities.vacante import Vacante
from domain.exceptions import BusinessRuleError
from domain.ports.repositories import VacanteRepositoryPort
from domain.services.vacante_rules import validar_cupos


class VacanteService:
    def __init__(self, repository: VacanteRepositoryPort):
        self.repository = repository

    def listar(self):
        return self.repository.listar()

    def obtener_por_id(self, id_vacante: int):
        return self.repository.obtener_por_id(id_vacante)

    def crear(self, vacante):
        self._validar_empresa(vacante.id_empresa)
        self._validar_carrera(vacante.id_carrera)
        self._validar_cupos(vacante.cupo_total, vacante.cupo_disponible)

        nueva_vacante = self.repository.nuevo(vacante.model_dump())
        return self.repository.crear(nueva_vacante)

    def actualizar(self, id_vacante: int, datos):
        vacante = self.obtener_por_id(id_vacante)
        if vacante is None:
            return None

        cambios = datos.model_dump(exclude_unset=True)
        if "id_carrera" in cambios:
            self._validar_carrera(cambios["id_carrera"])

        cupo_total = cambios.get("cupo_total", vacante.cupo_total)
        cupo_disponible = cambios.get("cupo_disponible", vacante.cupo_disponible)
        ocupados = vacante.cupo_total - vacante.cupo_disponible

        self._validar_cupos(cupo_total, cupo_disponible)
        if cupo_total < ocupados:
            raise HTTPException(
                status_code=400,
                detail="El cupo total no puede ser menor al número de asignaciones existentes"
            )

        return self.repository.actualizar(vacante, cambios)

    def eliminar(self, id_vacante: int):
        vacante = self.obtener_por_id(id_vacante)
        if vacante is None:
            return None
        return self.repository.eliminar(vacante)

    def _validar_cupos(self, cupo_total: int, cupo_disponible: int):
        try:
            validar_cupos(cupo_total, cupo_disponible)
        except BusinessRuleError as exc:
            raise HTTPException(status_code=400, detail=exc.message) from exc

    def _validar_empresa(self, id_empresa: int):
        empresa = self.repository.obtener_empresa(id_empresa)
        if empresa is None:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        if empresa.estado_empresa != "Activa":
            raise HTTPException(status_code=400, detail="La empresa no está activa")

    def _validar_carrera(self, id_carrera: int):
        carrera = self.repository.obtener_carrera(id_carrera)
        if carrera is None:
            raise HTTPException(status_code=404, detail="Carrera no encontrada")

    def _to_domain(self, vacante):
        return Vacante(
            id_vacante=vacante.id_vacante,
            id_empresa=vacante.id_empresa,
            id_carrera=vacante.id_carrera,
            titulo=vacante.titulo,
            modalidad=vacante.modalidad,
            cupo_total=vacante.cupo_total,
            cupo_disponible=vacante.cupo_disponible,
            estado_vacante=vacante.estado_vacante,
            descripcion=vacante.descripcion,
            horario=vacante.horario,
        )
