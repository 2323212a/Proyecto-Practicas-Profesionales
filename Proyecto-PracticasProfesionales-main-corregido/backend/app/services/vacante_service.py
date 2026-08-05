from fastapi import HTTPException

from domain.entities.vacante import Vacante
from domain.ports.repositories import VacanteRepositoryPort


class VacanteService:
    def __init__(self, repository: VacanteRepositoryPort):
        self.repository = repository

    def listar(self):
        return self.repository.listar()

    def obtener_por_id(self, id_vacante: int):
        return self.repository.obtener_por_id(id_vacante)

    def crear(self, vacante):
        self._validar_empresa(vacante.id_empresa)
        if vacante.cupos <= 0:
            raise HTTPException(status_code=400, detail="Los cupos deben ser mayores a cero")

        nueva_vacante = self.repository.nuevo(vacante.model_dump())
        return self.repository.crear(nueva_vacante)

    def actualizar(self, id_vacante: int, datos):
        vacante = self.obtener_por_id(id_vacante)
        if vacante is None:
            return None

        cambios = datos.model_dump(exclude_unset=True)
        cupos = cambios.get("cupos", vacante.cupos)
        if cupos <= 0:
            raise HTTPException(status_code=400, detail="Los cupos deben ser mayores a cero")

        ocupados = len(getattr(vacante, "asignaciones", []) or [])
        if cupos < ocupados:
            raise HTTPException(
                status_code=400,
                detail="Los cupos no pueden ser menores al numero de asignaciones existentes",
            )

        return self.repository.actualizar(vacante, cambios)

    def eliminar(self, id_vacante: int):
        vacante = self.obtener_por_id(id_vacante)
        if vacante is None:
            return None
        return self.repository.eliminar(vacante)

    def _validar_empresa(self, id_empresa: int):
        empresa = self.repository.obtener_empresa(id_empresa)
        if empresa is None:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        if empresa.estado_empresa != "Activa":
            raise HTTPException(status_code=400, detail="La empresa no esta activa")

    def _to_domain(self, vacante):
        return Vacante(
            id_vacante=vacante.id_vacante,
            id_empresa=vacante.id_empresa,
            id_convocatoria=vacante.id_convocatoria,
            id_tipo_practica=vacante.id_tipo_practica,
            titulo=vacante.titulo,
            cupos=vacante.cupos,
            periodo=vacante.periodo,
            estado_vacante=vacante.estado_vacante,
            descripcion=vacante.descripcion,
            actividades=vacante.actividades,
            requisitos=vacante.requisitos,
            observaciones=vacante.observaciones,
        )
