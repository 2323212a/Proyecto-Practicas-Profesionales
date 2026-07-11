from sqlalchemy import Boolean, Column, Integer, String
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class TipoPracticaModel(Base):
    __tablename__ = "tipo_practica"

    id_tipo_practica = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False, unique=True)
    horas_requeridas = Column(Integer, nullable=False, default=480, server_default="480")
    activo = Column(Boolean, nullable=False, default=True, server_default="1")

    vacantes = relationship("VacanteModel", back_populates="tipo_practica")
