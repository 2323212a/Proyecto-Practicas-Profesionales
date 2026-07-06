from sqlalchemy import Column, Integer, String, Text, Enum
from database.connection import Base


class EmpresaModel(Base):
    __tablename__ = "empresa"

    id_empresa = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    id_usuario = Column(
        Integer,
        nullable=True
    )

    nombre_empresa = Column(
        String(150),
        nullable=False
    )

    rfc = Column(
        String(20),
        nullable=True
    )

    giro = Column(
        String(100),
        nullable=True
    )

    domicilio = Column(
        Text,
        nullable=True
    )

    telefono = Column(
        String(15),
        nullable=True
    )

    correo_contacto = Column(
        String(100),
        nullable=True
    )

    estado_empresa = Column(
        Enum("Pendiente", "Activa", "Suspendida", "Inactiva"),
        default="Pendiente"
    )