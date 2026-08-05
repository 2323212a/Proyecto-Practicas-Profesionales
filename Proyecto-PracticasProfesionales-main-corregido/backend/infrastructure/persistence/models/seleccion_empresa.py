from sqlalchemy import CheckConstraint, Column, Computed, DateTime, Enum, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class SeleccionEmpresaModel(Base):
    __tablename__ = "seleccion_empresa"
    __table_args__ = (
        UniqueConstraint(
            "id_alumno",
            "id_convocatoria",
            "id_vacante",
            "seleccion_activa",
            name="uq_seleccion_vacante_activa",
        ),
        UniqueConstraint(
            "id_alumno",
            "id_convocatoria",
            "prioridad",
            "seleccion_activa",
            name="uq_seleccion_prioridad_activa",
        ),
        CheckConstraint("prioridad BETWEEN 1 AND 3", name="chk_seleccion_prioridad"),
    )

    id_seleccion = Column(Integer, primary_key=True, autoincrement=True)
    id_alumno = Column(Integer, ForeignKey("alumno.id_alumno"), nullable=False)
    id_convocatoria = Column(Integer, ForeignKey("convocatoria.id_convocatoria"), nullable=False)
    id_vacante = Column(Integer, ForeignKey("vacante.id_vacante"), nullable=False)
    prioridad = Column(Integer, nullable=False)
    estado = Column(
        Enum("Registrada", "Cancelada"),
        nullable=False,
        default="Registrada",
        server_default="Registrada",
    )
    seleccion_activa = Column(Integer, Computed("case when (`estado` = 'Registrada') then 1 else NULL end"))
    observaciones = Column(Text, nullable=True)
    fecha_seleccion = Column(DateTime, nullable=False, server_default=func.now())
    fecha_revision = Column(DateTime, nullable=True)
    revisado_por = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)

    alumno = relationship("AlumnoModel", back_populates="selecciones_empresa")
    convocatoria = relationship("ConvocatoriaModel")
    vacante = relationship("VacanteModel")
    revisor = relationship("UsuarioModel")
