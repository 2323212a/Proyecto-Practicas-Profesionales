from sqlalchemy import CheckConstraint, Column, Date, Enum, Integer, String
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class ConvocatoriaModel(Base):
    __tablename__ = "convocatoria"
    __table_args__ = (
        CheckConstraint("fecha_fin >= fecha_inicio", name="chk_convocatoria_fechas"),
    )

    id_convocatoria = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    periodo = Column(String(50), nullable=False, unique=True)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    estado = Column(
        Enum(
            "Activa",
            "Inactiva",
            "Finalizada"
        ),
        nullable=False,
        default="Activa",
        server_default="Activa"
    )

    expedientes = relationship("ExpedienteModel", back_populates="convocatoria")
    asignaciones = relationship("AsignacionModel", back_populates="convocatoria")
