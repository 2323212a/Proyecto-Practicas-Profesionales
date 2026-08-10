from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.vacante import VacanteModel
from infrastructure.persistence.repositories.base_repository import SQLAlchemyRepository


class VacanteRepository(SQLAlchemyRepository):
    def __init__(self, db):
        super().__init__(db, VacanteModel, "id_vacante")

    def obtener_empresa(self, id_empresa: int):
        return (
            self.db.query(EmpresaModel)
            .filter(EmpresaModel.id_empresa == id_empresa)
            .first()
        )

    def nuevo(self, datos):
        return VacanteModel(**datos)
