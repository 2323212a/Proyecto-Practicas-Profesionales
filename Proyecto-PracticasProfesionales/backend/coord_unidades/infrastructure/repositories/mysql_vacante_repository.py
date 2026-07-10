from sqlalchemy.orm import Session

from coord_unidades.domain.repositories.vacante_repository import (
    VacanteRepository,
)
from coord_unidades.infrastructure.database.models.vacante_model import (
    VacanteModel,
)


class MySQLVacanteRepository(VacanteRepository):

    def __init__(self, db: Session):
        self.db = db

    def listar_vacantes(self):
        return self.db.query(VacanteModel).all()

    def obtener_vacante_por_id(self, id_vacante: int):
        return (
            self.db.query(VacanteModel)
            .filter(VacanteModel.id_vacante == id_vacante)
            .first()
        )

    def aprobar_vacante(self, id_vacante: int):
        vacante = self.obtener_vacante_por_id(id_vacante)

        if not vacante:
            return None

        vacante.estado_vacante = "Aprobada"

        self.db.commit()
        self.db.refresh(vacante)

        return vacante
