from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class NotificacionModel(Base):
    __tablename__ = "notificacion"

    id_notificacion = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    titulo = Column(String(150), nullable=False)
    mensaje = Column(Text, nullable=False)
    leida = Column(Boolean, nullable=False, default=False, server_default="0")
    fecha_envio = Column(DateTime, nullable=False, server_default=func.now())

    usuario = relationship("UsuarioModel")
