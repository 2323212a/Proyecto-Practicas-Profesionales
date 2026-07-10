from abc import ABC, abstractmethod


class SolicitudUnidadRepository(ABC):

    @abstractmethod
    def obtener_empresa_por_rfc(self, rfc: str):
        pass

    @abstractmethod
    def crear_empresa_con_solicitud(self, data):
        pass

    @abstractmethod
    def reenviar_solicitud(self, empresa):
        pass

    @abstractmethod
    def obtener_solicitud_por_id(self, id_solicitud: int):
        pass

    @abstractmethod
    def aprobar_solicitud(self, solicitud):
        pass

    @abstractmethod
    def rechazar_solicitud(self, solicitud, data):
        pass

    @abstractmethod
    def listar_solicitudes(self, estado=None, nombre_empresa=None, rfc=None):
        pass
