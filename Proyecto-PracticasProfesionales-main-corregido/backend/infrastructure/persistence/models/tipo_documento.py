from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class TipoDocumentoModel(Base):
    __tablename__ = "tipo_documento_alumno"
    __table_args__ = (
        UniqueConstraint("nombre", "etapa", "bloque", name="uq_tipo_documento_alumno_nombre_etapa_bloque"),
    )

    id_tipo_documento = Column("id_tipo_documento_alumno", Integer, primary_key=True, autoincrement=True)
    nombre_documento = Column("nombre", String(180), nullable=False)
    descripcion = Column(Text, nullable=True)
    instrucciones = Column(Text, nullable=True)
    etapa = Column(Enum("Elegibilidad", "Expediente", "SeleccionEmpresa", "Asignacion", "AsignacionFirmada", "Liberacion"), nullable=False)
    bloque = Column(Integer, nullable=False, default=1, server_default="1")
    obligatorio = Column(Boolean, nullable=False, default=True, server_default="1")
    activo = Column(Boolean, nullable=False, default=True, server_default="1")
    requiere_formato = Column(Boolean, nullable=False, default=False, server_default="0")
    requiere_generacion = Column(Boolean, nullable=False, default=False, server_default="0")
    codigo_generacion = Column(String(100), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    documentos = relationship("DocumentoModel", back_populates="tipo_documento")
    formatos = relationship("FormatoDocumentoModel", back_populates="tipo_documento")
