from coord_unidades.domain.repositories.vacante_repository import (
    VacanteRepository,
)


class AprobarVacanteUseCase:

    def __init__(self, repository: VacanteRepository):
        self.repository = repository

    def execute(self, id_vacante: int):
        vacante = self.repository.aprobar_vacante(id_vacante)

        if not vacante:
            raise Exception("Vacante no encontrada")

        return vacante
