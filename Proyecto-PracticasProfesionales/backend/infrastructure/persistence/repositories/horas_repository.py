from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.horas import HorasModel
from infrastructure.persistence.repositories.base_repository import SQLAlchemyRepository


class HorasRepository(SQLAlchemyRepository):
    def __init__(self, db):
        super().__init__(db, HorasModel, "id_horas")

    def listar_por_asignacion(self, id_asignacion: int):
        return (
            self.db.query(HorasModel)
            .filter(HorasModel.id_asignacion == id_asignacion)
            .all()
        )

    def obtener_asignacion(self, id_asignacion: int):
        return (
            self.db.query(AsignacionModel)
            .filter(AsignacionModel.id_asignacion == id_asignacion)
            .first()
        )

    def nuevo(self, datos):
        return HorasModel(**datos)
