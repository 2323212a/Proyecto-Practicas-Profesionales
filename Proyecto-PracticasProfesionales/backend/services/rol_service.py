from models.rol import RolModel
from schemas.rol import RolCreate


class RolService:
    def __init__(self, db):
        self.db = db

    def listar(self):
        return self.db.query(RolModel).all()

    def crear(self, rol: RolCreate):
        nuevo_rol = RolModel(
            nombre=rol.nombre,
            descripcion=rol.descripcion
        )

        self.db.add(nuevo_rol)
        self.db.commit()
        self.db.refresh(nuevo_rol)

        return nuevo_rol