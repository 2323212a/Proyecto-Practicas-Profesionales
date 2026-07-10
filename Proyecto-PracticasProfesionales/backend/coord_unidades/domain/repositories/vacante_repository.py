from abc import ABC, abstractmethod


class VacanteRepository(ABC):

    @abstractmethod
    def listar_vacantes(self):
        pass

    @abstractmethod
    def obtener_vacante_por_id(self, id_vacante: int):
        pass

    @abstractmethod
    def aprobar_vacante(self, id_vacante: int):
        pass
