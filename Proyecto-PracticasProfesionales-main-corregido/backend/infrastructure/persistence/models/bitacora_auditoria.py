from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class BitacoraAuditoriaModel(Base):
    __tablename__ = "bitacora_auditoria"

    id_bitacora = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    accion = Column(String(255), nullable=False)
    tabla_afectada = Column(String(100), nullable=False)
    fecha_accion = Column(DateTime, nullable=False, server_default=func.now())
    detalles = Column(Text, nullable=True)

    usuario = relationship("UsuarioModel")
