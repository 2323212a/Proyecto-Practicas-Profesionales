from coord_unidades.domain.repositories.notificacion_repository import (
    NotificacionRepository,
)


class ListarNotificacionesUseCase:

    def __init__(self, repository: NotificacionRepository):
        self.repository = repository

    def execute(self):
        return self.repository.listar_notificaciones()
