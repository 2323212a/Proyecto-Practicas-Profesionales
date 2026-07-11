from domain.entities.vacante import Vacante
from domain.exceptions import BusinessRuleError


def validar_cupos(cupo_total: int, cupo_disponible: int):
    if cupo_disponible > cupo_total:
        raise BusinessRuleError("El cupo disponible no puede superar el cupo total")


def validar_vacante_disponible(vacante: Vacante):
    if vacante.estado_vacante != "Activa":
        raise BusinessRuleError("La vacante no está activa")
    if vacante.cupo_disponible <= 0:
        raise BusinessRuleError("La vacante no tiene cupo disponible")


def descontar_cupo(vacante: Vacante):
    validar_vacante_disponible(vacante)
    vacante.cupo_disponible -= 1
    if vacante.cupo_disponible <= 0:
        vacante.estado_vacante = "Cerrada"


def restaurar_cupo(vacante: Vacante):
    if vacante.cupo_disponible < vacante.cupo_total:
        vacante.cupo_disponible += 1
    if vacante.cupo_disponible > 0:
        vacante.estado_vacante = "Activa"
