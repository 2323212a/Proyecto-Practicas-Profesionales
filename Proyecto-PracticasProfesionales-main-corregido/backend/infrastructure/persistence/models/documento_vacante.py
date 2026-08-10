from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class DocumentoVacanteModel(Base):
    __tablename__ = "documento_vacante"

    id_documento_vacante = Column(Integer, primary_key=True, autoincrement=True)
    id_vacante = Column(Integer, ForeignKey("vacante.id_vacante"), nullable=False)
    tipo_documento = Column(Enum("Plan de trabajo"), nullable=False, default="Plan de trabajo", server_default="Plan de trabajo")
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(500), nullable=False)
    estado_documento = Column(
        Enum("Pendiente", "Aprobado", "Observado", "Rechazado"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente",
    )
    observaciones = Column(Text, nullable=True)
    fecha_subida = Column(DateTime, nullable=False, server_default=func.now())
    fecha_revision = Column(DateTime, nullable=True)
    revisado_por = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)
    activo = Column(Boolean, nullable=False, default=True, server_default="1")
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    vacante = relationship("VacanteModel", back_populates="documentos")
    revisor = relationship("UsuarioModel")
