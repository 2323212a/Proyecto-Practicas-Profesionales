from models.carrera import CarreraModel


class CarreraService:

    def __init__(self, db):
        self.db = db

    def listar(self):
        return self.db.query(
            CarreraModel
        ).all()

    def crear(self, carrera):

        nueva_carrera = CarreraModel(
            clave=carrera.clave,
            nombre=carrera.nombre
        )

        self.db.add(nueva_carrera)
        self.db.commit()
        self.db.refresh(nueva_carrera)

        return nueva_carrera