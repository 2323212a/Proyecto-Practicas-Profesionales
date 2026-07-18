from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class FormatoDocumentoModel(Base):
    __tablename__ = "formato_documento_alumno"

    id_formato = Column("id_formato_documento_alumno", Integer, primary_key=True, autoincrement=True)
    id_tipo_documento = Column("id_tipo_documento_alumno", Integer, ForeignKey("tipo_documento_alumno.id_tipo_documento_alumno"), nullable=False)
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(500), nullable=False)
    mime_type = Column(String(120), nullable=True)
    descripcion = Column(Text, nullable=True)
    activo = Column(Boolean, nullable=False, default=True, server_default="1")
    fecha_actualizacion = Column(DateTime, nullable=True)
    subido_por = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    tipo_documento = relationship("TipoDocumentoModel", back_populates="formatos")
