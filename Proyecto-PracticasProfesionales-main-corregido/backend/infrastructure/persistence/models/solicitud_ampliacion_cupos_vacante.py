from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class SolicitudAmpliacionCuposVacanteModel(Base):
    __tablename__ = "solicitud_ampliacion_cupos_vacante"

    id_solicitud_ampliacion = Column(Integer, primary_key=True, autoincrement=True)
    id_vacante = Column(Integer, ForeignKey("vacante.id_vacante"), nullable=False)
    id_tipo_practica = Column(Integer, ForeignKey("tipo_practica.id_tipo_practica"), nullable=True)
    cupos_solicitados = Column(Integer, nullable=False)
    motivo = Column(Text, nullable=False)
    estado = Column(
        Enum("Pendiente", "Aprobada", "Rechazada"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente",
    )
    fecha_solicitud = Column(DateTime, nullable=False, server_default=func.now())
    fecha_revision = Column(DateTime, nullable=True)
    revisada_por = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    vacante = relationship("VacanteModel", back_populates="solicitudes_ampliacion")
    tipo_practica = relationship("TipoPracticaModel")
    revisor = relationship("UsuarioModel")
    detalles = relationship("SolicitudAmpliacionCuposVacanteDetalleModel", back_populates="solicitud")
