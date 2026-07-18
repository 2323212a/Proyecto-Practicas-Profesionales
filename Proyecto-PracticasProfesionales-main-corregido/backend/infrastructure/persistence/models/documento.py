from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class DocumentoModel(Base):
    __tablename__ = "documento_alumno"
    __table_args__ = (
        UniqueConstraint("id_expediente", "id_tipo_documento_alumno", name="uq_documento_alumno_expediente_tipo"),
    )

    id_documento = Column("id_documento_alumno", Integer, primary_key=True, autoincrement=True)
    id_expediente = Column(Integer, ForeignKey("expediente_alumno.id_expediente"), nullable=False)
    id_tipo_documento = Column("id_tipo_documento_alumno", Integer, ForeignKey("tipo_documento_alumno.id_tipo_documento_alumno"), nullable=False)
    nombre_archivo = Column(String(255), nullable=True)
    ruta_archivo = Column(String(500), nullable=True)
    mime_type = Column(String(120), nullable=True)
    estado_documento = Column(
        Enum("Pendiente", "Aprobado", "Observado", "Rechazado"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente",
    )
    generado_por_sistema = Column(Boolean, nullable=False, default=False, server_default="0")
    requiere_validacion_automatica = Column(Boolean, nullable=False, default=False, server_default="0")
    validacion_automatica_estado = Column(
        Enum("Pendiente", "Valido", "Invalido", "No aplica"),
        nullable=False,
        default="No aplica",
        server_default="No aplica",
    )
    fecha_validacion_automatica = Column(DateTime, nullable=True)
    observaciones = Column(Text, nullable=True)
    fecha_carga = Column(DateTime, nullable=False, server_default=func.now())
    fecha_revision = Column(DateTime, nullable=True)
    revisado_por = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    expediente = relationship("ExpedienteModel", back_populates="documentos")
    tipo_documento = relationship("TipoDocumentoModel", back_populates="documentos")
    observaciones_relacionadas = relationship("ObservacionModel", back_populates="documento")
