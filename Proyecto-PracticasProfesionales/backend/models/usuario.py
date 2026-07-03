from sqlalchemy import Column, Integer, String, DateTime, Enum
from database.connection import Base


class UsuarioModel(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, autoincrement=True)

    id_rol = Column(Integer, nullable=False)

    nombre = Column(String(100), nullable=False)

    apellido_paterno = Column(String(50))
    apellido_materno = Column(String(50))

    correo = Column(String(100), nullable=False, unique=True)

    password = Column(String(255), nullable=False)

    estado = Column(
        Enum("Activo", "Inactivo"),
        default="Activo"
    )

    fecha_registro = Column(DateTime)