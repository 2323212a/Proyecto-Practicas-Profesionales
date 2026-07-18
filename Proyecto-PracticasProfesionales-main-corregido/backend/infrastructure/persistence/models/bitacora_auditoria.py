from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class BitacoraAuditoriaModel(Base):
    __tablename__ = "bitacora_auditoria"

    id_bitacora = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)
    accion = Column(String(255), nullable=False)
    modulo = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    entidad = Column(String(100), nullable=True)
    id_entidad = Column(Integer, nullable=True)
    fecha = Column(DateTime, nullable=False, server_default=func.now())
    ip = Column(String(45), nullable=True)
    user_agent = Column(String(500), nullable=True)

    usuario = relationship("UsuarioModel")
