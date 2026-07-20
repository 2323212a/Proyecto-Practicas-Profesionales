from sqlalchemy import Column, DateTime, Integer, String, Text, func
from infrastructure.database.connection import Base


class ColaCorreosModel(Base):
    __tablename__ = "cola_correos"

    id = Column(Integer, primary_key=True, autoincrement=True)
    destinatario = Column(String(120), nullable=False)
    asunto = Column(String(200), nullable=False)
    contenido = Column(Text, nullable=False)
    contenido_html = Column(Text, nullable=True)
    estado = Column(String(20), nullable=False, default="PENDIENTE", server_default="PENDIENTE")
    fecha_creacion = Column(DateTime, nullable=False, server_default=func.now())
    fecha_envio = Column(DateTime, nullable=True)
    intentos = Column(Integer, nullable=False, default=0, server_default="0")
    error_ultimo = Column(Text, nullable=True)
