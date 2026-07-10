from coord_unidades.domain.repositories.notificacion_repository import (
    NotificacionRepository,
)


class EnviarNotificacionUseCase:

    def __init__(self, repository: NotificacionRepository):
        self.repository = repository

    def execute(self, data):
        return self.repository.enviar_notificacion(data)
