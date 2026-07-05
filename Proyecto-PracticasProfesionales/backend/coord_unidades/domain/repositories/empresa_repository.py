from abc import ABC, abstractmethod


class EmpresaRepository(ABC):

    @abstractmethod
    def listar_empresas(self):
        pass

    @abstractmethod
    def obtener_empresa_por_id(self, id_empresa: int):
        pass

    @abstractmethod
    def validar_empresa(self, id_empresa: int):
        pass
