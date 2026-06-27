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
    
    def actualizar(self, id_convocatoria: int, datos):
        convocatoria = (
            self.db.query(ConvocatoriaModel)
            .filter(ConvocatoriaModel.id_convocatoria == id_convocatoria)
            .first()
        )

        if convocatoria is None:
            return None

        convocatoria.nombre = datos.nombre
        convocatoria.periodo = datos.periodo
        convocatoria.fecha_inicio = datos.fecha_inicio
        convocatoria.fecha_fin = datos.fecha_fin
        convocatoria.estado = datos.estado

        self.db.commit()
        self.db.refresh(convocatoria)

        return convocatoria

    def eliminar(self, id_convocatoria: int):
        convocatoria = (
            self.db.query(ConvocatoriaModel)
            .filter(ConvocatoriaModel.id_convocatoria == id_convocatoria)
            .first()
        )

        if convocatoria is None:
            return None

        self.db.delete(convocatoria)
        self.db.commit()

        return convocatoria