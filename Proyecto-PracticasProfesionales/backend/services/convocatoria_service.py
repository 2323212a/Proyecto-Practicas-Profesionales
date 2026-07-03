from models.convocatoria import ConvocatoriaModel


class ConvocatoriaService:

    def __init__(self, db):
        self.db = db

    def listar(self):
        return self.db.query(
            ConvocatoriaModel
        ).all()

    def crear(self, convocatoria):

        nueva = ConvocatoriaModel(
            nombre=convocatoria.nombre,
            periodo=convocatoria.periodo,
            fecha_inicio=convocatoria.fecha_inicio,
            fecha_fin=convocatoria.fecha_fin,
            estado=convocatoria.estado
        )

        self.db.add(nueva)
        self.db.commit()
        self.db.refresh(nueva)

        return nueva