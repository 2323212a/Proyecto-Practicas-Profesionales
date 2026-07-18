from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, Text, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class TipoDocumentoEmpresaModel(Base):
    __tablename__ = "tipo_documento_empresa"

    id_tipo_documento_empresa = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(120), nullable=False)
    descripcion = Column(Text, nullable=True)
    obligatorio = Column(Boolean, nullable=False, default=True, server_default="1")
    requiere_formato = Column(Boolean, nullable=False, default=False, server_default="0")
    activo = Column(Boolean, nullable=False, default=True, server_default="1")
    etapa = Column(
        Enum("Documentacion", "Convenio", "Vinculacion"),
        nullable=False,
        default="Documentacion",
        server_default="Documentacion",
    )
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    formatos = relationship("FormatoEmpresaModel", back_populates="tipo_documento")
    documentos = relationship("DocumentoEmpresaModel", back_populates="tipo_documento")
