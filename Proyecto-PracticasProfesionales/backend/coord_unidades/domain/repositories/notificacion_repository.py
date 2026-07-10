from abc import ABC, abstractmethod


class NotificacionRepository(ABC):

    @abstractmethod
    def listar_notificaciones(self):
        pass

    @abstractmethod
    def enviar_notificacion(self, data):
        pass
