from coord_unidades.domain.repositories.empresa_repository import (
    EmpresaRepository,
)


class ValidarEmpresaUseCase:

    def __init__(self, repository: EmpresaRepository):
        self.repository = repository

    def execute(self, id_empresa: int):
        empresa = self.repository.obtener_empresa_por_id(id_empresa)

        if not empresa:
            raise Exception("Empresa no encontrada")

        if empresa.estado_empresa == "Aprobada":
            raise Exception("La empresa ya esta aprobada")

        return self.repository.validar_empresa(id_empresa)
