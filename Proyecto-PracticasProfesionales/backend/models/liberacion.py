from sqlalchemy import Column, Integer, Date, String, Text, Enum
from database import Base

class Liberacion(Base):
    __tablename__ = "liberacion"

    id_liberacion = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_asignacion = Column(Integer, nullable=False)
    fecha_liberacion = Column(Date, nullable=True)
    documento_liberacion = Column(String(255), nullable=True)
    estado_liberacion = Column(Enum("Pendiente", "Emitida"), default="Pendiente")
    observaciones = Column(Text, nullable=True)