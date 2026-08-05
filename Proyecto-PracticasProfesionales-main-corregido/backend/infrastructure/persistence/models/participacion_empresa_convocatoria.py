from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class ParticipacionEmpresaConvocatoriaModel(Base):
    __tablename__ = "participacion_empresa_convocatoria"
    __table_args__ = (
        UniqueConstraint("id_empresa", "id_convocatoria", name="uq_participacion_empresa_convocatoria"),
    )

    id_participacion = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"), nullable=False)
    id_convocatoria = Column(Integer, ForeignKey("convocatoria.id_convocatoria"), nullable=False)
    estado = Column(
        Enum("Pendiente", "Aceptada", "Rechazada", "Cerrada"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente",
    )
    fecha_solicitud = Column(DateTime, nullable=False, server_default=func.now())
    fecha_revision = Column(DateTime, nullable=True)
    revisada_por = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)
    observaciones = Column(Text, nullable=True)
    motivo_rechazo = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    empresa = relationship("EmpresaModel", back_populates="participaciones")
    convocatoria = relationship("ConvocatoriaModel")
