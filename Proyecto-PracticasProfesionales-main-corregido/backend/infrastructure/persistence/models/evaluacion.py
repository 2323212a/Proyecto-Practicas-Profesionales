from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, Numeric, Text, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class EvaluacionModel(Base):
    __tablename__ = "evaluacion_practica"

    id_evaluacion = Column(Integer, primary_key=True, autoincrement=True)
    id_asignacion = Column(Integer, ForeignKey("asignacion.id_asignacion"), nullable=False)
    id_usuario_evaluador = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    tipo_evaluacion = Column(Enum("Asesor", "Empresa"), nullable=False)
    calificacion = Column(Numeric(5, 2), nullable=True)
    comentarios = Column(Text, nullable=True)
    fecha_evaluacion = Column(DateTime, nullable=False, server_default=func.now())
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    asignacion = relationship("AsignacionModel", back_populates="evaluaciones")
    evaluador = relationship("UsuarioModel")
