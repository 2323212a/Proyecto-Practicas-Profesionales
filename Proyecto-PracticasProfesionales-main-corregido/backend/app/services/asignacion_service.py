from __future__ import annotations

from datetime import date

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
        self._validar_asesor(asignacion.id_asesor)
        self._validar_empresa_activa(asignacion.id_empresa)
        self._obtener_vacante_disponible(
            asignacion.id_vacante,
            asignacion.id_empresa,
            asignacion.id_convocatoria,
            asignacion.id_tipo_practica,
            alumno.periodo_practica,
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

        # La DB limpia no usa estado_alumno para asignado; la asignación activa representa el proceso.
        return self.repository.crear(nueva_asignacion)

    def actualizar(self, id_asignacion: int, datos):
        asignacion = self.obtener_por_id(id_asignacion)
        if asignacion is None:
            return None

        cambios = datos.model_dump(exclude_unset=True)
        if "id_asesor" in cambios:
            self._validar_asesor(cambios["id_asesor"])

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
            self._obtener_vacante_disponible(
                asignacion.id_vacante,
                asignacion.id_empresa,
                asignacion.id_convocatoria,
                asignacion.id_tipo_practica,
                asignacion.alumno.periodo_practica if getattr(asignacion, "alumno", None) else None,
            )

    def _restaurar_cupo(self, asignacion):
        vacante = self.repository.obtener_vacante(asignacion.id_vacante)
        if vacante and vacante.estado_vacante == "Cerrada":
            vacante.estado_vacante = "Activa"

    def _obtener_vacante_disponible(
        self,
        id_vacante: int,
        id_empresa: int,
        id_convocatoria: int,
        id_tipo_practica: int,
        periodo_practica: str | None,
    ):
        vacante = self.repository.obtener_vacante(id_vacante)
        if vacante is None:
            raise HTTPException(status_code=404, detail="Vacante no encontrada")
        if vacante.id_empresa != id_empresa:
            try:
                validar_vacante_pertenece_a_empresa(vacante.id_empresa, id_empresa)
            except BusinessRuleError as exc:
                raise HTTPException(status_code=400, detail=exc.message) from exc
        if vacante.id_convocatoria != id_convocatoria:
            raise HTTPException(status_code=400, detail="La vacante no pertenece a la convocatoria indicada")
        if vacante.id_tipo_practica != id_tipo_practica:
            raise HTTPException(status_code=400, detail="La vacante no corresponde al tipo de practica del alumno")
        if periodo_practica is not None and vacante.periodo != periodo_practica:
            raise HTTPException(status_code=400, detail="La vacante no corresponde al periodo del alumno")
        try:
            asignaciones_activas = self.repository.contar_asignaciones_activas_vacante(id_vacante)
            validar_vacante_disponible(self._vacante_to_domain(vacante), asignaciones_activas)
        except BusinessRuleError as exc:
            raise HTTPException(status_code=400, detail=exc.message) from exc
        return vacante

    def _actualizar_estado_vacante(self, vacante):
        asignaciones_activas = len(
            [item for item in getattr(vacante, "asignaciones", []) if item.estado_asignacion == "Activa"]
        )
        if asignaciones_activas >= vacante.cupos:
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

    def _validar_asesor(self, id_asesor: int | None):
        if id_asesor is None:
            return
        asesor = self.repository.obtener_asesor(id_asesor)
        if asesor is None:
            raise HTTPException(status_code=404, detail="Asesor no encontrado")

    def _validar_empresa_activa(self, id_empresa: int):
        empresa = self.repository.obtener_empresa(id_empresa)
        if empresa is None:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        if empresa.estado_empresa != "Activa":
            raise HTTPException(
                status_code=400,
                detail="No se puede asignar al alumno a una empresa suspendida o inactiva",
            )
        tiene_convenio = self.repository.tiene_convenio_vigente(id_empresa, date.today())
        if not tiene_convenio:
            raise HTTPException(
                status_code=400,
                detail="No se puede asignar al alumno a una empresa sin convenio vigente",
            )
        return empresa

    def _vacante_to_domain(self, vacante):
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

    def _asignacion_to_domain(self, asignacion):
        return Asignacion(
            id_asignacion=asignacion.id_asignacion,
            id_alumno=asignacion.id_alumno,
            id_empresa=asignacion.id_empresa,
            id_vacante=asignacion.id_vacante,
            id_convocatoria=asignacion.id_convocatoria,
            id_tipo_practica=asignacion.id_tipo_practica,
            id_asesor=asignacion.id_asesor,
            fecha_asignacion=asignacion.fecha_asignacion,
            estado_asignacion=asignacion.estado_asignacion,
            tipo_asignacion=asignacion.tipo_asignacion,
        )
