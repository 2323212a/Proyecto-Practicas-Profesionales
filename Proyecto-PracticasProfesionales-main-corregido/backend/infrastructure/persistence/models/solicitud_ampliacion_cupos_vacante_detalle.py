from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class SolicitudAmpliacionCuposVacanteDetalleModel(Base):
    __tablename__ = "solicitud_ampliacion_cupos_vacante_detalle"
    __table_args__ = (
        UniqueConstraint("id_solicitud_ampliacion", "id_tipo_practica", name="uq_ampliacion_detalle_tipo"),
    )

    id_detalle_ampliacion = Column(Integer, primary_key=True, autoincrement=True)
    id_solicitud_ampliacion = Column(
        Integer,
        ForeignKey("solicitud_ampliacion_cupos_vacante.id_solicitud_ampliacion"),
        nullable=False,
    )
    id_tipo_practica = Column(Integer, ForeignKey("tipo_practica.id_tipo_practica"), nullable=False)
    cupos_solicitados = Column(Integer, nullable=False)
    cupos_aprobados = Column(Integer, nullable=True)
    estado = Column(
        Enum("Pendiente", "Aprobada", "Rechazada"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente",
    )
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    solicitud = relationship("SolicitudAmpliacionCuposVacanteModel", back_populates="detalles")
    tipo_practica = relationship("TipoPracticaModel")
