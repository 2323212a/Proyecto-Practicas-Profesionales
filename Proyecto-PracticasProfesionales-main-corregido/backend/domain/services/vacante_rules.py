from domain.exceptions import BusinessRuleError


def validar_cupos(cupos: int):
    if cupos <= 0:
        raise BusinessRuleError("Los cupos deben ser mayores a cero")


def cupos_disponibles(vacante, asignaciones_activas: int = 0) -> int:
    return max((vacante.cupos or 0) - asignaciones_activas, 0)


def validar_vacante_disponible(vacante, asignaciones_activas: int = 0):
    if vacante.estado_vacante != "Activa":
        raise BusinessRuleError("La vacante no esta activa")
    if cupos_disponibles(vacante, asignaciones_activas) <= 0:
        raise BusinessRuleError("La vacante no tiene cupos disponibles")
