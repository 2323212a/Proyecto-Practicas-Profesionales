from abc import ABC, abstractmethod


class PadronEmpresarialRepository(ABC):

    @abstractmethod
    def listar_padron(self):
        pass
