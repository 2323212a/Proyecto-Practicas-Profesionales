from sqlalchemy import CheckConstraint, Column, DateTime, Enum, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class SeleccionEmpresaModel(Base):
    __tablename__ = "seleccion_empresa"
    __table_args__ = (
        UniqueConstraint("id_alumno", "id_empresa", name="uq_seleccion_alumno_empresa"),
        UniqueConstraint("id_alumno", "prioridad", name="uq_seleccion_alumno_prioridad"),
        CheckConstraint("prioridad BETWEEN 1 AND 10", name="chk_seleccion_prioridad"),
    )

    id_seleccion = Column(Integer, primary_key=True, autoincrement=True)
    id_alumno = Column(Integer, ForeignKey("alumno.id_alumno"), nullable=False)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"), nullable=False)
    id_vacante = Column(Integer, ForeignKey("vacante.id_vacante"), nullable=True)
    prioridad = Column(Integer, nullable=False)
    estado_seleccion = Column(
        Enum("Pendiente", "Aprobada", "Rechazada"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente",
    )
    observaciones = Column(Text, nullable=True)
    fecha_seleccion = Column(DateTime, nullable=False, server_default=func.now())
    fecha_revision = Column(DateTime, nullable=True)
    id_usuario_revisor = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)

    alumno = relationship("AlumnoModel", back_populates="selecciones_empresa")
    empresa = relationship("EmpresaModel", back_populates="selecciones")
    vacante = relationship("VacanteModel")
    revisor = relationship("UsuarioModel")
