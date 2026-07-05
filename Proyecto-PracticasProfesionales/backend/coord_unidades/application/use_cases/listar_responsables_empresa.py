from coord_unidades.domain.repositories.responsable_empresa_repository import (
    ResponsableEmpresaRepository,
)


class ListarResponsablesEmpresaUseCase:

    def __init__(self, repository: ResponsableEmpresaRepository):
        self.repository = repository

    def execute(self, id_empresa: int):
        return self.repository.listar_responsables_empresa(id_empresa)
