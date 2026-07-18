from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class FormatoEmpresaModel(Base):
    __tablename__ = "formato_empresa"

    id_formato_empresa = Column(Integer, primary_key=True, autoincrement=True)
    id_tipo_documento_empresa = Column(
        Integer,
        ForeignKey("tipo_documento_empresa.id_tipo_documento_empresa"),
        nullable=False,
    )
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(255), nullable=False)
    version = Column(String(50), nullable=True)
    fecha_subida = Column(DateTime, nullable=False, server_default=func.now())
    subido_por = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)
    activo = Column(Boolean, nullable=False, default=True, server_default="1")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    tipo_documento = relationship("TipoDocumentoEmpresaModel", back_populates="formatos")
