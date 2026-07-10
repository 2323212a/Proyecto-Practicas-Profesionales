from coord_unidades.domain.repositories.solicitud_unidad_repository import (
    SolicitudUnidadRepository,
)


class SolicitudUnidadNoEncontradaError(Exception):
    pass


class SolicitudUnidadNoAprobableError(Exception):
    pass


class AprobarSolicitudUnidadUseCase:

    def __init__(self, repository: SolicitudUnidadRepository):
        self.repository = repository

    def execute(self, id_solicitud: int):
        solicitud = self.repository.obtener_solicitud_por_id(id_solicitud)

        if not solicitud:
            raise SolicitudUnidadNoEncontradaError("Solicitud no encontrada.")

        if not solicitud.empresa:
            raise SolicitudUnidadNoEncontradaError(
                "Empresa asociada a la solicitud no encontrada."
            )

        if solicitud.estado == "Aprobada":
            raise SolicitudUnidadNoAprobableError(
                "La solicitud ya fue aprobada."
            )

        if solicitud.estado == "Rechazada":
            raise SolicitudUnidadNoAprobableError(
                "No se puede aprobar una solicitud rechazada."
            )

        if solicitud.estado not in ("Pendiente", "En Revision"):
            raise SolicitudUnidadNoAprobableError(
                "La solicitud no puede aprobarse en su estado actual."
            )

        solicitud = self.repository.aprobar_solicitud(solicitud)

        return {
            "success": True,
            "message": "Solicitud aprobada correctamente.",
            "id_empresa": solicitud.id_empresa,
            "id_solicitud": solicitud.id_solicitud,
        }
