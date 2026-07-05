from coord_unidades.domain.repositories.convenio_repository import (
    ConvenioRepository,
)


class CrearConvenioUseCase:

    def __init__(self, repository: ConvenioRepository):
        self.repository = repository

    def execute(self, data):
        return self.repository.crear(data)
