from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class ObservacionModel(Base):
    __tablename__ = "observacion_documento_alumno"

    id_observacion = Column(Integer, primary_key=True, autoincrement=True)
    id_documento = Column("id_documento_alumno", Integer, ForeignKey("documento_alumno.id_documento_alumno"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    descripcion = Column(Text, nullable=False)
    tipo_observacion = Column(
        Enum("Documento observado", "Corrección solicitada", "Documento rechazado", "Revisión manual"),
        nullable=False,
    )
    fecha_observacion = Column(DateTime, nullable=False, server_default=func.now())
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    documento = relationship("DocumentoModel", back_populates="observaciones_relacionadas")
    usuario = relationship("UsuarioModel")
