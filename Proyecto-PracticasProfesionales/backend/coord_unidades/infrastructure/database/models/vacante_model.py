from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text
from sqlalchemy import func
from sqlalchemy.orm import relationship

from database.connection import Base


class VacanteModel(Base):
    __tablename__ = "vacante"

    id_vacante = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"))
    id_carrera = Column(Integer)

    titulo = Column(String(150))
    descripcion = Column(Text)
    modalidad = Column(Enum("Presencial", "Virtual", "Hibrida"))
    cupo_total = Column(Integer)
    cupo_disponible = Column(Integer)
    estado_vacante = Column(
        Enum("Pendiente", "Aprobada", "Cerrada"),
        default="Pendiente",
    )
    fecha_publicacion = Column(DateTime, server_default=func.now())

    empresa = relationship("EmpresaModel", back_populates="vacantes")
