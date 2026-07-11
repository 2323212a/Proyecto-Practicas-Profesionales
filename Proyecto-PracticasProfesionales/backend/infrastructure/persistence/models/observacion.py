from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class ObservacionModel(Base):
    __tablename__ = "observacion"

    id_observacion = Column(Integer, primary_key=True, autoincrement=True)
    id_documento = Column(Integer, ForeignKey("documento.id_documento"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    descripcion = Column(Text, nullable=False)
    tipo_observacion = Column(String(50), nullable=False)
    fecha_observacion = Column(DateTime, nullable=False, server_default=func.now())

    documento = relationship("DocumentoModel", back_populates="observaciones")
    usuario = relationship("UsuarioModel")
