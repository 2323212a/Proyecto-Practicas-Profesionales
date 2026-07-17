from sqlalchemy import Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class ReporteModel(Base):
    __tablename__ = "reporte"

    id_reporte = Column(Integer, primary_key=True, autoincrement=True)
    id_asignacion = Column(Integer, ForeignKey("asignacion.id_asignacion"), nullable=False)
    titulo = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    archivo = Column(String(255), nullable=False)
    fecha_entrega = Column(Date, nullable=False)
    estado_reporte = Column(
        Enum("Pendiente", "Aprobado", "Rechazado"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente"
    )

    calificacion = Column(Numeric(5, 2), nullable=True)
    observacion_asesor = Column(Text, nullable=True)
    fecha_revision = Column(DateTime, nullable=True)

    asignacion = relationship("AsignacionModel", back_populates="reportes")
