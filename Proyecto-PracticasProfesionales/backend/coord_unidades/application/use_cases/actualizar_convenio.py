from coord_unidades.domain.repositories.convenio_repository import (
    ConvenioRepository,
)


class ActualizarConvenioUseCase:

    def __init__(self, repository: ConvenioRepository):
        self.repository = repository

    def execute(self, id_convenio: int, data):
        return self.repository.actualizar(id_convenio, data)
