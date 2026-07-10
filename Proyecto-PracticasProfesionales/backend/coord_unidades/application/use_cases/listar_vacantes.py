from coord_unidades.domain.repositories.vacante_repository import (
    VacanteRepository,
)


class ListarVacantesUseCase:

    def __init__(self, repository: VacanteRepository):
        self.repository = repository

    def execute(self):
        return self.repository.listar_vacantes()
