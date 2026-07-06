from coord_unidades.domain.repositories.padron_empresarial_repository import (
    PadronEmpresarialRepository,
)


class ListarPadronEmpresarialUseCase:

    def __init__(self, repository: PadronEmpresarialRepository):
        self.repository = repository

    def execute(self):
        return self.repository.listar_padron()
