from abc import ABC, abstractmethod


class ConvenioRepository(ABC):

    @abstractmethod
    def listar(self):
        pass

    @abstractmethod
    def obtener_por_id(self, id_convenio: int):
        pass

    @abstractmethod
    def crear(self, data):
        pass

    @abstractmethod
    def actualizar(self, id_convenio: int, data):
        pass
