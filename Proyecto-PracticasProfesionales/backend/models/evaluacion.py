from sqlalchemy import Column, Integer, Date, Text, Enum, DECIMAL
from database import Base

class Evaluacion(Base):
    __tablename__ = "evaluacion"

    id_evaluacion = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_asignacion = Column(Integer, nullable=False)
    id_usuario_evaluador = Column(Integer, nullable=False)
    tipo_evaluacion = Column(Enum("Empresa", "Docente"), nullable=True)
    calificacion = Column(DECIMAL(5, 2), nullable=True)
    comentarios = Column(Text, nullable=True)
    fecha_evaluacion = Column(Date, nullable=True)