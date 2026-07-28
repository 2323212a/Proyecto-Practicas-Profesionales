from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class ReglaPracticaCarreraModel(Base):
    __tablename__ = "regla_practica_carrera"
    __table_args__ = (
        UniqueConstraint("id_carrera", "id_tipo_practica", name="uq_regla_practica_carrera_tipo"),
    )

    id_regla_practica_carrera = Column(Integer, primary_key=True, autoincrement=True)
    id_carrera = Column(Integer, ForeignKey("carrera.id_carrera"), nullable=False)
    id_tipo_practica = Column(Integer, ForeignKey("tipo_practica.id_tipo_practica"), nullable=False)
    periodo_requerido = Column(Integer, nullable=False)
    creditos_minimos = Column(Integer, nullable=False, default=0, server_default="0")
    horas_requeridas = Column(Integer, nullable=False, default=0, server_default="0")
    activo = Column(Boolean, nullable=False, default=True, server_default="1")
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    carrera = relationship("CarreraModel", back_populates="reglas_practica")
    tipo_practica = relationship("TipoPracticaModel", back_populates="reglas_carrera")
