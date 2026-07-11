from sqlalchemy import CheckConstraint, Column, Date, DateTime, Enum, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class HorasModel(Base):
    __tablename__ = "horas"
    __table_args__ = (
        CheckConstraint("horas_realizadas > 0", name="chk_horas_realizadas_positivas"),
    )

    id_horas = Column(Integer, primary_key=True, autoincrement=True)
    id_asignacion = Column(Integer, ForeignKey("asignacion.id_asignacion"), nullable=False)
    fecha = Column(Date, nullable=False)
    horas_realizadas = Column(Numeric(5, 2), nullable=False)
    actividad = Column(Text, nullable=False)
    evidencia_archivo = Column(String(255), nullable=True)
    estado_horas = Column(
        Enum("Pendiente", "Aprobada", "Rechazada"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente"
    )
    observaciones = Column(Text, nullable=True)
    fecha_registro = Column(DateTime, nullable=False, server_default=func.now())

    asignacion = relationship("AsignacionModel", back_populates="horas")
