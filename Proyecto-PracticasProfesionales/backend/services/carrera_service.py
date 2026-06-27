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
    
    def actualizar(self, id_carrera: int, datos):
        carrera = (
            self.db.query(CarreraModel)
            .filter(CarreraModel.id_carrera == id_carrera)
            .first()
        )

        if carrera is None:
            return None

        carrera.clave = datos.clave
        carrera.nombre = datos.nombre

        self.db.commit()
        self.db.refresh(carrera)

        return carrera

    def eliminar(self, id_carrera: int):
        carrera = (
            self.db.query(CarreraModel)
            .filter(CarreraModel.id_carrera == id_carrera)
            .first()
        )

        if carrera is None:
            return None

        self.db.delete(carrera)
        self.db.commit()

        return carrera