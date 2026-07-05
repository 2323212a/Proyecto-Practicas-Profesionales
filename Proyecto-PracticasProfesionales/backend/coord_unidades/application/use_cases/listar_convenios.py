from coord_unidades.domain.repositories.convenio_repository import (
    ConvenioRepository,
)


class ListarConveniosUseCase:

    def __init__(self, repository: ConvenioRepository):
        self.repository = repository

    def execute(self):
        return self.repository.listar()
