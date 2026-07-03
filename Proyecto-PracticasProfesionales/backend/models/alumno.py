from sqlalchemy import Column, Integer, String, Enum
from database.connection import Base


class AlumnoModel(Base):
    __tablename__ = "alumno"

    id_alumno = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, nullable=False)
    id_carrera = Column(Integer, nullable=False)

    matricula = Column(String(20), nullable=False, unique=True)

    semestre = Column(Integer, nullable=True)
    grupo = Column(String(10), nullable=True)

    creditos_aprobados = Column(Integer, default=0)

    estado_alumno = Column(
        Enum(
            "Activo",
            "Elegible",
            "Asignado",
            "Liberado",
            "No Elegible"
        ),
        default="Activo"
    )