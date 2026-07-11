from domain.entities.asignacion import Asignacion
from domain.exceptions import BusinessRuleError


def validar_vacante_pertenece_a_empresa(id_empresa_vacante: int, id_empresa_asignacion: int):
    if id_empresa_vacante != id_empresa_asignacion:
        raise BusinessRuleError("La vacante no pertenece a la empresa indicada")


def validar_no_cancelada(asignacion: Asignacion):
    if asignacion.estado_asignacion == "Cancelada":
        raise BusinessRuleError("La asignación está cancelada")
