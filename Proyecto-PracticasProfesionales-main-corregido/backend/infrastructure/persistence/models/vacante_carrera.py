from sqlalchemy import Column, DateTime, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class VacanteCarreraModel(Base):
    __tablename__ = "vacante_carrera"
    __table_args__ = (
        UniqueConstraint("id_vacante", "id_carrera", name="uq_vacante_carrera"),
    )

    id_vacante_carrera = Column(Integer, primary_key=True, autoincrement=True)
    id_vacante = Column(Integer, ForeignKey("vacante.id_vacante"), nullable=False)
    id_carrera = Column(Integer, ForeignKey("carrera.id_carrera"), nullable=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())

    vacante = relationship("VacanteModel", back_populates="carreras_config")
    carrera = relationship("CarreraModel")
