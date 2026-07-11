from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, UniqueConstraint, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class ExpedienteModel(Base):
    __tablename__ = "expediente"
    __table_args__ = (
        UniqueConstraint("id_alumno", "id_convocatoria", name="uq_expediente_alumno_convocatoria"),
    )

    id_expediente = Column(Integer, primary_key=True, autoincrement=True)
    id_alumno = Column(Integer, ForeignKey("alumno.id_alumno"), nullable=False)
    id_convocatoria = Column(Integer, ForeignKey("convocatoria.id_convocatoria"), nullable=False)
    estado_expediente = Column(
        Enum("Pendiente", "En Revision", "Aprobado", "Rechazado"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente"
    )
    fecha_creacion = Column(DateTime, nullable=False, server_default=func.now())
    fecha_actualizacion = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now()
    )

    alumno = relationship("AlumnoModel", back_populates="expedientes")
    convocatoria = relationship("ConvocatoriaModel", back_populates="expedientes")
    documentos = relationship("DocumentoModel", back_populates="expediente")
