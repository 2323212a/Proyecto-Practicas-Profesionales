from sqlalchemy import Column, Integer, String, Date, Enum
from database.connection import Base


class ConvocatoriaModel(Base):
    __tablename__ = "convocatoria"

    id_convocatoria = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    nombre = Column(String(100))
    periodo = Column(String(50))

    fecha_inicio = Column(Date)
    fecha_fin = Column(Date)

    estado = Column(
        Enum(
            "Activa",
            "Inactiva",
            "Finalizada"
        ),
        default="Activa"
    )