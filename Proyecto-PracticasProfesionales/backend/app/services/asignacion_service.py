from __future__ import annotations
from fastapi import HTTPException

from domain.entities.asignacion import Asignacion
from domain.entities.vacante import Vacante
from domain.exceptions import BusinessRuleError
from domain.ports.repositories import AsignacionRepositoryPort
from domain.services.asignacion_rules import validar_vacante_pertenece_a_empresa
from domain.services.vacante_rules import validar_vacante_disponible


class AsignacionService:
    def __init__(self, repository: AsignacionRepositoryPort):
        self.repository = repository

    def listar(self):
        return self.repository.listar()

    def obtener_por_id(self, id_asignacion: int):
        return self.repository.obtener_por_id(id_asignacion)

    def crear(self, asignacion):
        alumno = self._validar_alumno(asignacion.id_alumno)
        self._validar_convocatoria(asignacion.id_convocatoria)
        self._validar_docente(asignacion.id_docente)
        vacante = self._obtener_vacante_disponible(
            asignacion.id_vacante,
            asignacion.id_empresa
        )

        existente = self.repository.obtener_por_alumno_convocatoria(
            asignacion.id_alumno,
            asignacion.id_convocatoria,
        )
        if existente:
            raise HTTPException(
                status_code=400,
                detail="El alumno ya tiene asignación en esta convocatoria"
            )

        nueva_asignacion = self.repository.nuevo(asignacion.model_dump())
        self.repository.db.add(nueva_asignacion)

        if nueva_asignacion.estado_asignacion == "Activa":
            vacante.cupo_disponible -= 1
            self._actualizar_estado_vacante(vacante)

        alumno.estado_alumno = "Asignado"
        self.repository.commit()
        self.repository.refresh(nueva_asignacion)
        return nueva_asignacion

    def actualizar(self, id_asignacion: int, datos):
        asignacion = self.obtener_por_id(id_asignacion)
        if asignacion is None:
            return None

        cambios = datos.model_dump(exclude_unset=True)
        if "id_docente" in cambios:
            self._validar_docente(cambios["id_docente"])

        estado_anterior = asignacion.estado_asignacion
        estado_nuevo = cambios.get("estado_asignacion", estado_anterior)

        if estado_anterior != estado_nuevo:
            self._aplicar_cambio_estado(asignacion, estado_anterior, estado_nuevo)

        return self.repository.actualizar(asignacion, cambios)

    def finalizar(self, id_asignacion: int):
        return self._cambiar_estado(id_asignacion, "Finalizada")

    def cancelar(self, id_asignacion: int):
        return self._cambiar_estado(id_asignacion, "Cancelada")

    def eliminar(self, id_asignacion: int):
        asignacion = self.obtener_por_id(id_asignacion)
        if asignacion is None:
            return None

        if asignacion.estado_asignacion == "Activa":
            self._restaurar_cupo(asignacion)

        return self.repository.eliminar(asignacion)

    def _cambiar_estado(self, id_asignacion: int, estado: str):
        asignacion = self.obtener_por_id(id_asignacion)
        if asignacion is None:
            return None

        estado_anterior = asignacion.estado_asignacion
        if estado_anterior != estado:
            self._aplicar_cambio_estado(asignacion, estado_anterior, estado)
            asignacion.estado_asignacion = estado

        return self.repository.commit_refresh(asignacion)

    def _aplicar_cambio_estado(self, asignacion, estado_anterior: str, estado_nuevo: str):
        if estado_anterior == "Activa" and estado_nuevo == "Cancelada":
            self._restaurar_cupo(asignacion)
        elif estado_anterior == "Cancelada" and estado_nuevo == "Activa":
            vacante = self._obtener_vacante_disponible(
                asignacion.id_vacante,
                asignacion.id_empresa
            )
            vacante.cupo_disponible -= 1
            self._actualizar_estado_vacante(vacante)

    def _restaurar_cupo(self, asignacion):
        vacante = self.repository.obtener_vacante(asignacion.id_vacante)
        if vacante and vacante.cupo_disponible < vacante.cupo_total:
            vacante.cupo_disponible += 1
            if vacante.cupo_disponible > 0:
                vacante.estado_vacante = "Activa"

    def _obtener_vacante_disponible(self, id_vacante: int, id_empresa: int):
        vacante = self.repository.obtener_vacante(id_vacante)
        if vacante is None:
            raise HTTPException(status_code=404, detail="Vacante no encontrada")
        if vacante.id_empresa != id_empresa:
            try:
                validar_vacante_pertenece_a_empresa(vacante.id_empresa, id_empresa)
            except BusinessRuleError as exc:
                raise HTTPException(status_code=400, detail=exc.message) from exc
        try:
            validar_vacante_disponible(self._vacante_to_domain(vacante))
        except BusinessRuleError as exc:
            raise HTTPException(status_code=400, detail=exc.message) from exc
        return vacante

    def _actualizar_estado_vacante(self, vacante):
        if vacante.cupo_disponible <= 0:
            vacante.estado_vacante = "Cerrada"

    def _validar_alumno(self, id_alumno: int):
        alumno = self.repository.obtener_alumno(id_alumno)
        if alumno is None:
            raise HTTPException(status_code=404, detail="Alumno no encontrado")
        return alumno

    def _validar_convocatoria(self, id_convocatoria: int):
        convocatoria = self.repository.obtener_convocatoria(id_convocatoria)
        if convocatoria is None:
            raise HTTPException(status_code=404, detail="Convocatoria no encontrada")
        if convocatoria.estado != "Activa":
            raise HTTPException(status_code=400, detail="La convocatoria no está activa")

    def _validar_docente(self, id_docente: int | None):
        if id_docente is None:
            return
        docente = self.repository.obtener_docente(id_docente)
        if docente is None:
            raise HTTPException(status_code=404, detail="Docente no encontrado")

    def _vacante_to_domain(self, vacante):
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

    def _asignacion_to_domain(self, asignacion):
        return Asignacion(
            id_asignacion=asignacion.id_asignacion,
            id_alumno=asignacion.id_alumno,
            id_empresa=asignacion.id_empresa,
            id_vacante=asignacion.id_vacante,
            id_convocatoria=asignacion.id_convocatoria,
            id_docente=asignacion.id_docente,
            fecha_asignacion=asignacion.fecha_asignacion,
            estado_asignacion=asignacion.estado_asignacion,
            tipo_asignacion=asignacion.tipo_asignacion,
        )
