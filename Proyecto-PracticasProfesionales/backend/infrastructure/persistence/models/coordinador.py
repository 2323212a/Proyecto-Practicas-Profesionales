from sqlalchemy import Column, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class CoordinadorModel(Base):
    __tablename__ = "coordinador"

    id_coordinador = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False, unique=True)
    area = Column(String(100), nullable=True)
    departamento = Column(String(100), nullable=True)

    usuario = relationship("UsuarioModel", back_populates="coordinador")
