from coord_unidades.domain.repositories.responsable_empresa_repository import (
    ResponsableEmpresaRepository,
)


class CrearResponsableEmpresaUseCase:

    def __init__(self, repository: ResponsableEmpresaRepository):
        self.repository = repository

    def execute(self, data):
        return self.repository.crear_responsable_empresa(data)
