from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class PersonalInternoModel(Base):
    __tablename__ = "personal_interno"

    id_personal = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False, unique=True)
    nombre = Column(String(120), nullable=False)
    apellido_paterno = Column(String(120), nullable=False)
    apellido_materno = Column(String(120), nullable=True)
    departamento = Column(String(150), nullable=True)
    cargo = Column(String(150), nullable=True)
    telefono = Column(String(30), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    usuario = relationship("UsuarioModel", back_populates="personal_interno")
    asignaciones = relationship("AsignacionModel", foreign_keys="AsignacionModel.id_asesor", back_populates="asesor")
