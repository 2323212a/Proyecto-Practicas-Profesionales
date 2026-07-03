from sqlalchemy import Column, Integer, DateTime, Enum, func
from database.connection import Base


class ExpedienteModel(Base):
    __tablename__ = "expediente"

    id_expediente = Column(Integer, primary_key=True, autoincrement=True)
    id_alumno = Column(Integer, nullable=False)
    id_convocatoria = Column(Integer, nullable=False)

    estado_expediente = Column(
        Enum("Pendiente", "En Revision", "Aprobado", "Rechazado"),
        default="Pendiente"
    )

    fecha_creacion = Column(DateTime, server_default=func.now())
    fecha_actualizacion = Column(DateTime, server_default=func.now(), onupdate=func.now())