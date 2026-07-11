from sqlalchemy import Boolean, Column, Integer, String, Text
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class TipoDocumentoEmpresaModel(Base):
    __tablename__ = "tipo_documento_empresa"

    id_tipo_documento_empresa = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(120), nullable=False, unique=True)
    descripcion = Column(Text, nullable=True)
    obligatorio = Column(Boolean, nullable=False, default=True, server_default="1")
    requiere_formato = Column(Boolean, nullable=False, default=False, server_default="0")
    activo = Column(Boolean, nullable=False, default=True, server_default="1")

    formatos = relationship("FormatoEmpresaModel", back_populates="tipo_documento")
    documentos = relationship("DocumentoEmpresaModel", back_populates="tipo_documento")
