from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class CarreraModel(Base):
    __tablename__ = "carrera"

    id_carrera = Column(Integer, primary_key=True, autoincrement=True)
    clave = Column(String(20), nullable=False, unique=True)
    nombre = Column(String(100), nullable=False, unique=True)

    alumnos = relationship("AlumnoModel", back_populates="carrera")
    vacantes = relationship("VacanteModel", back_populates="carrera")
