from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class DocenteAsesorModel(Base):
    __tablename__ = "docente_asesor"

    id_docente = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False, unique=True)
    departamento = Column(String(100), nullable=False)

    usuario = relationship("UsuarioModel", back_populates="docente")
    asignaciones = relationship("AsignacionModel", back_populates="docente")
