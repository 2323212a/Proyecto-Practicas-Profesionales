from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class TipoUnidadReceptoraModel(Base):
    __tablename__ = "tipo_unidad_receptora"

    id_tipo_unidad_receptora = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(150), nullable=False, unique=True)
    descripcion = Column(Text, nullable=True)
    activo = Column(Boolean, nullable=False, default=True, server_default="1")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    empresas = relationship("EmpresaModel", back_populates="tipo_unidad_receptora")
    requisitos = relationship("RequisitoEmpresaTipoUnidadModel", back_populates="tipo_unidad_receptora")
