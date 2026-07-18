from sqlalchemy import Column, Date, DateTime, Enum, Integer, String, Text, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class ConvocatoriaModel(Base):
    __tablename__ = "convocatoria"

    id_convocatoria = Column(Integer, primary_key=True, autoincrement=True)
    nombre = Column(String(100), nullable=False)
    tipo_periodo = Column(
        Enum("Semestral", "Cuatrimestral"),
        nullable=False,
        default="Semestral",
        server_default="Semestral",
    )
    estado = Column(
        Enum(
            "Activa",
            "Inactiva",
            "Cerrada",
        ),
        nullable=False,
        default="Activa",
        server_default="Activa"
    )
    fecha_inicio_general = Column(Date, nullable=True)
    fecha_cierre_general = Column(Date, nullable=True)
    fecha_inicio_empresas = Column(Date, nullable=True)
    fecha_cierre_empresas = Column(Date, nullable=True)
    fecha_inicio_documentos = Column(Date, nullable=True)
    fecha_cierre_documentos = Column(Date, nullable=True)
    fecha_inicio_validacion = Column(Date, nullable=True)
    fecha_cierre_validacion = Column(Date, nullable=True)
    fecha_inicio_seleccion = Column(Date, nullable=True)
    fecha_cierre_seleccion = Column(Date, nullable=True)
    fecha_inicio_asignacion = Column(Date, nullable=True)
    fecha_cierre_asignacion = Column(Date, nullable=True)
    fecha_inicio_practicas = Column(Date, nullable=True)
    fecha_cierre_practicas = Column(Date, nullable=True)
    fecha_inicio_cierre = Column(Date, nullable=True)
    fecha_cierre_cierre = Column(Date, nullable=True)
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    expedientes = relationship("ExpedienteModel", back_populates="convocatoria")
    asignaciones = relationship("AsignacionModel", back_populates="convocatoria")
