from sqlalchemy import Column, Integer, Date, Enum
from database import Base

class Asignacion(Base):
    __tablename__ = "asignacion"

    id_asignacion = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_alumno = Column(Integer, nullable=False)
    id_empresa = Column(Integer, nullable=False)
    id_vacante = Column(Integer, nullable=False)
    id_convocatoria = Column(Integer, nullable=False)
    id_docente = Column(Integer, nullable=True)
    fecha_asignacion = Column(Date, nullable=True)
    estado_asignacion = Column(Enum("Activa", "Finalizada", "Cancelada"), default="Activa")
    tipo_asignacion = Column(Enum("Normal", "Reasignacion", "Rezagado"), default="Normal")