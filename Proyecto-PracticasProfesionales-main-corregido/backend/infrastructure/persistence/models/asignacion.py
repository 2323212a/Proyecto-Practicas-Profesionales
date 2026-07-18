from sqlalchemy import Column, DateTime, Enum, ForeignKey, ForeignKeyConstraint, Integer, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class AsignacionModel(Base):
    __tablename__ = "asignacion"
    __table_args__ = (
        UniqueConstraint("id_alumno", "id_convocatoria", name="uq_asignacion_alumno_convocatoria"),
        ForeignKeyConstraint(
            ["id_vacante", "id_empresa"],
            ["vacante.id_vacante", "vacante.id_empresa"],
            name="fk_asignacion_vacante_empresa"
        ),
    )

    id_asignacion = Column(Integer, primary_key=True, autoincrement=True)
    id_alumno = Column(Integer, ForeignKey("alumno.id_alumno"), nullable=False)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"), nullable=False)
    id_vacante = Column(Integer, nullable=False)
    id_convocatoria = Column(Integer, ForeignKey("convocatoria.id_convocatoria"), nullable=False)
    id_tipo_practica = Column(Integer, ForeignKey("tipo_practica.id_tipo_practica"), nullable=False)
    id_asesor = Column(Integer, ForeignKey("personal_interno.id_personal"), nullable=True)
    fecha_asignacion = Column(DateTime, nullable=False, server_default=func.now())
    estado_asignacion = Column(
        Enum("Activa", "Finalizada", "Cancelada"),
        nullable=False,
        default="Activa",
        server_default="Activa"
    )
    tipo_asignacion = Column(
        Enum("Normal", "Reasignacion", "Rezagado"),
        nullable=False,
        default="Normal",
        server_default="Normal"
    )
    asignado_por = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    alumno = relationship("AlumnoModel", back_populates="asignaciones")
    empresa = relationship("EmpresaModel", back_populates="asignaciones", overlaps="asignaciones,vacante")
    vacante = relationship("VacanteModel", back_populates="asignaciones", overlaps="empresa")
    convocatoria = relationship("ConvocatoriaModel", back_populates="asignaciones")
    tipo_practica = relationship("TipoPracticaModel")
    asesor = relationship("PersonalInternoModel", foreign_keys=[id_asesor], back_populates="asignaciones")
    reportes = relationship("ReporteModel", back_populates="asignacion")
    evaluaciones = relationship("EvaluacionModel", back_populates="asignacion")
    liberacion = relationship("LiberacionModel", back_populates="asignacion", uselist=False)
    horas = relationship("HorasModel", back_populates="asignacion")
