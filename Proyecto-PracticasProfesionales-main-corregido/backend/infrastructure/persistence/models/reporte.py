from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class ReporteModel(Base):
    __tablename__ = "reporte_practica"

    id_reporte = Column(Integer, primary_key=True, autoincrement=True)
    id_asignacion = Column(Integer, ForeignKey("asignacion.id_asignacion"), nullable=False)
    tipo_reporte = Column(Enum("Parcial", "Final", "Otro"), nullable=False, default="Parcial", server_default="Parcial")
    titulo = Column(String(180), nullable=False)
    descripcion = Column(Text, nullable=True)
    archivo = Column(String(500), nullable=True)
    fecha_entrega = Column(DateTime, nullable=False, server_default=func.now())
    estado_reporte = Column(
        Enum("Pendiente", "Aprobado", "Rechazado"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente",
    )
    calificacion = Column(Numeric(5, 2), nullable=True)
    observacion_asesor = Column(Text, nullable=True)
    fecha_revision = Column(DateTime, nullable=True)
    revisado_por = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    asignacion = relationship("AsignacionModel", back_populates="reportes")
