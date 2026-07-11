from sqlalchemy import Boolean, Column, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class TipoDocumentoModel(Base):
    __tablename__ = "tipo_documento"
    __table_args__ = (
        UniqueConstraint("nombre_documento", "etapa", name="uq_tipo_documento_nombre_etapa"),
    )

    id_tipo_documento = Column(Integer, primary_key=True, autoincrement=True)
    nombre_documento = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    etapa = Column(String(50), nullable=False)
    obligatorio = Column(Boolean, nullable=False, default=True, server_default="1")
    requiere_formato = Column(Boolean, nullable=False, default=False, server_default="0")

    documentos = relationship("DocumentoModel", back_populates="tipo_documento")
