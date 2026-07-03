from sqlalchemy import Column, Integer, String, Text, Enum
from database.connection import Base


class Vacante(Base):
    __tablename__ = "vacante"

    id_vacante = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_empresa = Column(Integer, nullable=False)
    id_carrera = Column(Integer, nullable=False)
    titulo = Column(String(100), nullable=True)
    descripcion = Column(Text, nullable=True)
    modalidad = Column(Enum("Presencial", "Virtual", "Hibrida"), nullable=True)
    horario = Column(String(100), nullable=True)
    cupo_total = Column(Integer, nullable=True)
    cupo_disponible = Column(Integer, nullable=True)
    estado_vacante = Column(Enum("Activa", "Cerrada"), default="Activa")