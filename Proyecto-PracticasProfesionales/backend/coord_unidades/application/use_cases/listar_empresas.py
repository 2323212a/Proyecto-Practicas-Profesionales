from coord_unidades.domain.repositories.empresa_repository import (
    EmpresaRepository,
)


class ListarEmpresasUseCase:

    def __init__(self, repository: EmpresaRepository):
        self.repository = repository

    def execute(self):
        return self.repository.listar_empresas()
