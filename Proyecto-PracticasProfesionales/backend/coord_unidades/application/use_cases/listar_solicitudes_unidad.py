from coord_unidades.domain.repositories.solicitud_unidad_repository import (
    SolicitudUnidadRepository,
)


class ListarSolicitudesUnidadUseCase:

    def __init__(self, repository: SolicitudUnidadRepository):
        self.repository = repository

    def execute(self, estado=None, nombre_empresa=None, rfc=None):
        estado = self._limpiar_texto(estado)
        nombre_empresa = self._limpiar_texto(nombre_empresa)
        rfc = self._limpiar_texto(rfc)

        if rfc:
            rfc = rfc.upper()

        solicitudes = self.repository.listar_solicitudes(
            estado=estado,
            nombre_empresa=nombre_empresa,
            rfc=rfc,
        )

        return [
            {
                "id_solicitud": solicitud.id_solicitud,
                "id_empresa": solicitud.id_empresa,
                "nombre_empresa": solicitud.nombre_empresa,
                "rfc": solicitud.rfc,
                "giro": solicitud.giro,
                "telefono": solicitud.telefono,
                "correo_contacto": solicitud.correo_contacto,
                "estado": solicitud.estado,
                "fecha_solicitud": self._format_fecha(
                    solicitud.fecha_solicitud
                ),
            }
            for solicitud in solicitudes
        ]

    def _limpiar_texto(self, value):
        if value is None:
            return None

        value = value.strip()

        if not value:
            return None

        return value

    def _format_fecha(self, value):
        if value is None:
            return None

        return value.strftime("%Y-%m-%d %H:%M:%S")
