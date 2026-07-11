from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class DocumentoEmpresaModel(Base):
    __tablename__ = "documento_empresa"
    __table_args__ = (
        UniqueConstraint(
            "id_empresa",
            "id_tipo_documento_empresa",
            name="uq_documento_empresa_tipo",
        ),
    )

    id_documento_empresa = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"), nullable=False)
    id_tipo_documento_empresa = Column(
        Integer,
        ForeignKey("tipo_documento_empresa.id_tipo_documento_empresa"),
        nullable=False,
    )
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(255), nullable=False)
    mime_type = Column(String(120), nullable=False)
    estado_documento = Column(
        Enum("Pendiente", "Aprobado", "Rechazado"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente",
    )
    observaciones = Column(Text, nullable=True)
    fecha_carga = Column(DateTime, nullable=False, server_default=func.now())
    fecha_revision = Column(DateTime, nullable=True)

    empresa = relationship("EmpresaModel")
    tipo_documento = relationship("TipoDocumentoEmpresaModel", back_populates="documentos")
