from datetime import datetime

from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Text
from sqlalchemy.orm import relationship

from database.connection import Base


class SolicitudUnidadModel(Base):
    __tablename__ = "solicitud_unidad"

    id_solicitud = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"), nullable=False)

    estado = Column(
        Enum("Pendiente", "En Revision", "Aprobada", "Rechazada"),
        default="Pendiente",
        nullable=False,
    )
    fecha_solicitud = Column(DateTime, default=datetime.utcnow)
    fecha_revision = Column(DateTime, nullable=True)
    observaciones = Column(Text, nullable=True)

    empresa = relationship("EmpresaModel", back_populates="solicitudes")
