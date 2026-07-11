from sqlalchemy import CheckConstraint, Column, Date, ForeignKey, Integer, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class EvaluacionEmpresaAlumnoModel(Base):
    __tablename__ = "evaluacion_empresa_alumno"
    __table_args__ = (
        UniqueConstraint("id_asignacion", name="uq_evaluacion_empresa_alumno_asignacion"),
        CheckConstraint("calificacion BETWEEN 0 AND 100", name="chk_eval_empresa_alumno_calificacion"),
    )

    id_evaluacion_empresa_alumno = Column(Integer, primary_key=True, autoincrement=True)
    id_asignacion = Column(Integer, ForeignKey("asignacion.id_asignacion"), nullable=False)
    id_alumno = Column(Integer, ForeignKey("alumno.id_alumno"), nullable=False)
    calificacion = Column(Numeric(5, 2), nullable=False)
    respuestas = Column(Text, nullable=True)
    incidencias_detectadas = Column(Text, nullable=True)
    comentarios = Column(Text, nullable=True)
    fecha_evaluacion = Column(Date, nullable=False)

    asignacion = relationship("AsignacionModel")
    alumno = relationship("AlumnoModel")
