from pydantic import ValidationError

from coord_unidades.domain.repositories.solicitud_unidad_repository import (
    SolicitudUnidadRepository,
)
from coord_unidades.presentation.schemas.solicitud_unidad_schema import (
    SolicitudUnidadCreate,
)


class SolicitudUnidadConflictError(Exception):
    pass


class DatosSolicitudUnidadInvalidosError(Exception):
    pass


class RegistrarSolicitudUnidadUseCase:

    def __init__(self, repository: SolicitudUnidadRepository):
        self.repository = repository

    def execute(self, payload):
        try:
            data = SolicitudUnidadCreate.model_validate(payload)
        except ValidationError as exc:
            raise DatosSolicitudUnidadInvalidosError("Datos inv\u00e1lidos") from exc

        empresa = self.repository.obtener_empresa_por_rfc(data.rfc)

        if not empresa:
            empresa, solicitud = self.repository.crear_empresa_con_solicitud(data)
            return {
                "success": True,
                "message": "Solicitud enviada correctamente.",
                "id_empresa": empresa.id_empresa,
                "id_solicitud": solicitud.id_solicitud,
            }

        if empresa.estado_empresa == "Pendiente":
            raise SolicitudUnidadConflictError(
                "La empresa ya tiene una solicitud pendiente."
            )

        if empresa.estado_empresa == "En Revision":
            raise SolicitudUnidadConflictError(
                "La empresa est\u00e1 siendo revisada."
            )

        if empresa.estado_empresa == "Aprobada":
            raise SolicitudUnidadConflictError(
                "La empresa ya pertenece al sistema."
            )

        if empresa.estado_empresa == "Rechazada":
            empresa, solicitud = self.repository.reenviar_solicitud(empresa)
            return {
                "success": True,
                "message": "Solicitud reenviada correctamente.",
                "id_empresa": empresa.id_empresa,
                "id_solicitud": solicitud.id_solicitud,
            }

        raise SolicitudUnidadConflictError(
            "La empresa no puede enviar una solicitud en su estado actual."
        )
