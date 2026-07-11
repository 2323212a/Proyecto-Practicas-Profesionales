from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class FormatoDocumentoModel(Base):
    __tablename__ = "formato_documento"

    id_formato = Column(Integer, primary_key=True, autoincrement=True)
    id_tipo_documento = Column(Integer, ForeignKey("tipo_documento.id_tipo_documento"), nullable=False)
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(255), nullable=False)
    mime_type = Column(String(120), nullable=False)
    descripcion = Column(Text, nullable=True)
    activo = Column(Boolean, nullable=False, default=True, server_default="1")
    fecha_actualizacion = Column(DateTime, nullable=False, server_default=func.now())

    tipo_documento = relationship("TipoDocumentoModel")
