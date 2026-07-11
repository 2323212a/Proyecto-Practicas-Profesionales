from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class SolicitudEmpresaModel(Base):
    __tablename__ = "solicitud_empresa"

    id_solicitud_empresa = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"), nullable=False)
    tipo_tramite = Column(Enum("Convenio", "Vinculacion"), nullable=False, default="Convenio")
    periodo_participacion = Column(
        Enum("Semestral", "Cuatrimestral", "Ambos"),
        nullable=False,
        default="Ambos",
    )
    estado_solicitud = Column(
        Enum("Recibida", "En revision", "Aceptada", "Rechazada"),
        nullable=False,
        default="Recibida",
        server_default="Recibida",
    )
    motivo_rechazo = Column(Text, nullable=True)
    observaciones = Column(Text, nullable=True)
    fecha_solicitud = Column(DateTime, nullable=False, server_default=func.now())
    fecha_revision = Column(DateTime, nullable=True)
    revisada_por = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)

    empresa = relationship("EmpresaModel", back_populates="solicitudes")
