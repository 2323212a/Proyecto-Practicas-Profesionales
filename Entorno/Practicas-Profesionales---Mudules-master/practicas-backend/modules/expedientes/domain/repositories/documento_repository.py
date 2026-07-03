from abc import ABC, abstractmethod

class DocumentoRepository(ABC):

    @abstractmethod
    def crear(self, documento):
        pass

    @abstractmethod
    def obtener_por_id(self, id_documento):
        pass

    @abstractmethod
    def listar_por_expediente(
        self,
        id_expediente
    ):
        pass

    @abstractmethod
    def cambiar_estado(
        self,
        id_documento,
        estado
    ):
        pass
