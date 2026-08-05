from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class VacanteTipoPracticaModel(Base):
    __tablename__ = "vacante_tipo_practica"
    __table_args__ = (
        UniqueConstraint("id_vacante", "id_tipo_practica", name="uq_vacante_tipo_practica"),
    )

    id_vacante_tipo_practica = Column(Integer, primary_key=True, autoincrement=True)
    id_vacante = Column(Integer, ForeignKey("vacante.id_vacante"), nullable=False)
    id_tipo_practica = Column(Integer, ForeignKey("tipo_practica.id_tipo_practica"), nullable=False)
    cupos = Column(Integer, nullable=False, default=1, server_default="1")
    activo = Column(Boolean, nullable=False, default=True, server_default="1")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    vacante = relationship("VacanteModel", back_populates="tipos_practica_config")
    tipo_practica = relationship("TipoPracticaModel")
