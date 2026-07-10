from datetime import datetime

from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text

from database.connection import Base


class NotificacionModel(Base):
    __tablename__ = "notificacion"

    id_notificacion = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)

    titulo = Column(String(150), nullable=False)
    mensaje = Column(Text, nullable=False)
    tipo = Column(String(50), nullable=False, default="General")
    leida = Column(Boolean, nullable=False, default=False)
    fecha_envio = Column(DateTime, default=datetime.utcnow)
