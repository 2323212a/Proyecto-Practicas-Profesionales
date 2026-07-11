from infrastructure.persistence.models.rol import RolModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.persistence.repositories.base_repository import SQLAlchemyRepository


class UsuarioRepository(SQLAlchemyRepository):
    def __init__(self, db):
        super().__init__(db, UsuarioModel, "id_usuario")

    def obtener_por_correo(self, correo: str):
        return (
            self.db.query(UsuarioModel)
            .filter(UsuarioModel.correo == correo)
            .first()
        )

    def obtener_rol(self, id_rol: int):
        return self.db.query(RolModel).filter(RolModel.id_rol == id_rol).first()

    def nuevo(self, datos):
        return UsuarioModel(**datos)
