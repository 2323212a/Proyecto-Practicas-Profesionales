from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class RolModel(Base):
    __tablename__ = "rol"

    id_rol = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(50), nullable=False, unique=True)
    descripcion = Column(String(255), nullable=True)

    usuarios = relationship("UsuarioModel", back_populates="rol")
