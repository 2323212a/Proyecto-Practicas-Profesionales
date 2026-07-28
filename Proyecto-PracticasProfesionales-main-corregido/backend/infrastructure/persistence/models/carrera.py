from sqlalchemy import Column, DateTime, Enum, Integer, String, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class CarreraModel(Base):
    __tablename__ = "carrera"

    id_carrera = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False, unique=True)
    tipo_periodo = Column(
        Enum("Semestral", "Cuatrimestral"),
        nullable=False,
        default="Semestral",
        server_default="Semestral",
    )
    duracion_periodos = Column(Integer, nullable=True)
    creditos_totales = Column(Integer, nullable=True)
    estado = Column(
        Enum("Activa", "Inactiva"),
        nullable=False,
        default="Activa",
        server_default="Activa",
    )
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    alumnos = relationship("AlumnoModel", back_populates="carrera")
    reglas_practica = relationship("ReglaPracticaCarreraModel", back_populates="carrera")
