from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class DocumentoModel(Base):
    __tablename__ = "documento"
    __table_args__ = (
        UniqueConstraint("id_expediente", "id_tipo_documento", name="uq_documento_expediente_tipo"),
    )

    id_documento = Column(Integer, primary_key=True, autoincrement=True)
    id_expediente = Column(Integer, ForeignKey("expediente.id_expediente"), nullable=False)
    id_tipo_documento = Column(Integer, ForeignKey("tipo_documento.id_tipo_documento"), nullable=False)
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(255), nullable=False)
    estado_documento = Column(
        Enum("Pendiente", "Aprobado", "Observado", "Rechazado"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente"
    )
    fecha_carga = Column(DateTime, nullable=False, server_default=func.now())
    generado_por_sistema = Column(Boolean, nullable=False, default=False, server_default="0")
    requiere_validacion_automatica = Column(Boolean, default=False)
    validacion_automatica_estado = Column(
        Enum("No validado", "Prevalidado", "No valido", "Revision manual"),
        default="No validado"
    )
    fecha_validacion_automatica = Column(DateTime, nullable=True)

    expediente = relationship("ExpedienteModel", back_populates="documentos")
    tipo_documento = relationship("TipoDocumentoModel", back_populates="documentos")
    observaciones = relationship("ObservacionModel", back_populates="documento")
