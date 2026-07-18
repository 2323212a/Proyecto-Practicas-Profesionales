from sqlalchemy import Column, DateTime, ForeignKey, Integer, JSON, Numeric, Text, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class EvaluacionEmpresaAlumnoModel(Base):
    __tablename__ = "evaluacion_alumno_empresa"

    id_evaluacion_empresa_alumno = Column("id_evaluacion_alumno_empresa", Integer, primary_key=True, autoincrement=True)
    id_asignacion = Column(Integer, ForeignKey("asignacion.id_asignacion"), nullable=False)
    id_alumno = Column(Integer, ForeignKey("alumno.id_alumno"), nullable=False)
    calificacion = Column(Numeric(5, 2), nullable=True)
    respuestas = Column(JSON, nullable=True)
    incidencias_detectadas = Column(JSON, nullable=True)
    comentarios = Column(Text, nullable=True)
    fecha_evaluacion = Column(DateTime, nullable=False, server_default=func.now())
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    asignacion = relationship("AsignacionModel")
    alumno = relationship("AlumnoModel")
