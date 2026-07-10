from pydantic import ValidationError

from coord_unidades.domain.repositories.solicitud_unidad_repository import (
    SolicitudUnidadRepository,
)
from coord_unidades.presentation.schemas.solicitud_unidad_schema import (
    SolicitudUnidadRechazoRequest,
)


class SolicitudUnidadRechazoDatosInvalidosError(Exception):
    pass


class SolicitudUnidadRechazoNoEncontradaError(Exception):
    pass


class SolicitudUnidadNoRechazableError(Exception):
    pass


class RechazarSolicitudUnidadUseCase:

    def __init__(self, repository: SolicitudUnidadRepository):
        self.repository = repository

    def execute(self, id_solicitud: int, payload):
        try:
            data = SolicitudUnidadRechazoRequest.model_validate(payload)
        except ValidationError as exc:
            raise SolicitudUnidadRechazoDatosInvalidosError(
                "Datos inv\u00e1lidos"
            ) from exc

        solicitud = self.repository.obtener_solicitud_por_id(id_solicitud)

        if not solicitud:
            raise SolicitudUnidadRechazoNoEncontradaError(
                "Solicitud no encontrada."
            )

        if not solicitud.empresa:
            raise SolicitudUnidadRechazoNoEncontradaError(
                "Empresa asociada a la solicitud no encontrada."
            )

        if solicitud.estado == "Rechazada":
            raise SolicitudUnidadNoRechazableError(
                "La solicitud ya fue rechazada."
            )

        if solicitud.estado == "Aprobada":
            raise SolicitudUnidadNoRechazableError(
                "No se puede rechazar una solicitud aprobada."
            )

        if solicitud.estado not in ("Pendiente", "En Revision"):
            raise SolicitudUnidadNoRechazableError(
                "La solicitud no puede rechazarse en su estado actual."
            )

        solicitud = self.repository.rechazar_solicitud(solicitud, data)

        return {
            "success": True,
            "message": "Solicitud rechazada correctamente.",
            "id_empresa": solicitud.id_empresa,
            "id_solicitud": solicitud.id_solicitud,
        }
