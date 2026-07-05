from sqlalchemy import Boolean, Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship

from database.connection import Base


class ResponsableEmpresaModel(Base):
    __tablename__ = "responsable_empresa"

    id_responsable = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"))

    nombre_completo = Column(String(150), nullable=False)
    cargo = Column(String(100))
    correo = Column(String(100))
    telefono = Column(String(15))
    activo = Column(Boolean, nullable=False, default=True)

    empresa = relationship("EmpresaModel", back_populates="responsables")
