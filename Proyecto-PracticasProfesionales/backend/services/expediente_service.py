from models.expediente import ExpedienteModel


class ExpedienteService:

    def __init__(self, db):
        self.db = db

    def listar(self):
        return self.db.query(ExpedienteModel).all()

    def obtener_por_id(self, id_expediente: int):
        return (
            self.db.query(ExpedienteModel)
            .filter(ExpedienteModel.id_expediente == id_expediente)
            .first()
        )

    def crear(self, expediente):
        nuevo = ExpedienteModel(
            id_alumno=expediente.id_alumno,
            id_convocatoria=expediente.id_convocatoria,
            estado_expediente=expediente.estado_expediente
        )

        self.db.add(nuevo)
        self.db.commit()
        self.db.refresh(nuevo)

        return nuevo