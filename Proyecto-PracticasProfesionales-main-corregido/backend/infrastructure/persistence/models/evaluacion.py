from sqlalchemy import CheckConstraint, Column, Date, Enum, ForeignKey, Integer, Numeric, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class EvaluacionModel(Base):
    __tablename__ = "evaluacion"
    __table_args__ = (
        UniqueConstraint("id_asignacion", "tipo_evaluacion", name="uq_evaluacion_asignacion_tipo"),
        CheckConstraint("calificacion BETWEEN 0 AND 100", name="chk_evaluacion_calificacion"),
    )

    id_evaluacion = Column(Integer, primary_key=True, autoincrement=True)
    id_asignacion = Column(Integer, ForeignKey("asignacion.id_asignacion"), nullable=False)
    id_usuario_evaluador = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    tipo_evaluacion = Column(Enum("Asesor", "Empresa"), nullable=False)
    calificacion = Column(Numeric(5, 2), nullable=False)
    comentarios = Column(Text, nullable=True)
    fecha_evaluacion = Column(Date, nullable=False)

    asignacion = relationship("AsignacionModel", back_populates="evaluaciones")
    evaluador = relationship("UsuarioModel")
