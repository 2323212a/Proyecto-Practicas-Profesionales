from abc import ABC, abstractmethod


class ResponsableEmpresaRepository(ABC):

    @abstractmethod
    def listar_responsables_empresa(self, id_empresa: int):
        pass

    @abstractmethod
    def crear_responsable_empresa(self, data):
        pass
