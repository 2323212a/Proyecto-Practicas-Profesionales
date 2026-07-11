from domain.exceptions import BusinessRuleError


def validar_asignacion_permite_horas(estado_asignacion: str, permitir_finalizada: bool = False):
    if estado_asignacion == "Cancelada":
        raise BusinessRuleError("No se pueden registrar horas en una asignación cancelada")
    if estado_asignacion == "Finalizada" and not permitir_finalizada:
        raise BusinessRuleError("No se pueden registrar horas en una asignación finalizada")


def validar_horas_editables(estado_horas: str):
    if estado_horas == "Aprobada":
        raise BusinessRuleError("No se puede modificar un registro de horas aprobado")
