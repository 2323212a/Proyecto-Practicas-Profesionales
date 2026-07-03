from models.alumno import AlumnoModel


class AlumnoService:

    def __init__(self, db):
        self.db = db

    def listar(self):
        return self.db.query(AlumnoModel).all()

    def obtener_por_id(self, id_alumno: int):
        return (
            self.db.query(AlumnoModel)
            .filter(AlumnoModel.id_alumno == id_alumno)
            .first()
        )

    def crear(self, alumno):
        nuevo_alumno = AlumnoModel(
            id_usuario=alumno.id_usuario,
            id_carrera=alumno.id_carrera,
            matricula=alumno.matricula,
            semestre=alumno.semestre,
            grupo=alumno.grupo,
            creditos_aprobados=alumno.creditos_aprobados,
            estado_alumno=alumno.estado_alumno
        )

        self.db.add(nuevo_alumno)
        self.db.commit()
        self.db.refresh(nuevo_alumno)

        return nuevo_alumno