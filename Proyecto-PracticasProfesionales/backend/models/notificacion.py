from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean
from database import Base
from sqlalchemy.sql import func

class Notificacion(Base):
    __tablename__ = "notificacion"

    id_notificacion = Column(Integer, primary_key=True, index=True, autoincrement=True)
    id_usuario = Column(Integer, nullable=False)
    titulo = Column(String(150), nullable=True)
    mensaje = Column(Text, nullable=True)
    leida = Column(Boolean, default=False)
    fecha_envio = Column(DateTime, server_default=func.now())