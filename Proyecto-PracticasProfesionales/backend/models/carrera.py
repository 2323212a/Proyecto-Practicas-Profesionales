from sqlalchemy import Column, Integer, String
from database.connection import Base


class CarreraModel(Base):
    __tablename__ = "carrera"

    id_carrera = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    clave = Column(
        String(20),
        nullable=False
    )

    nombre = Column(
        String(100),
        nullable=False
    )