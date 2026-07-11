from sqlalchemy import CheckConstraint, Column, Enum, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class VacanteModel(Base):
    __tablename__ = "vacante"
    __table_args__ = (
        UniqueConstraint("id_vacante", "id_empresa", name="uq_vacante_empresa"),
        CheckConstraint("cupo_disponible <= cupo_total", name="chk_vacante_cupos"),
    )

    id_vacante = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"), nullable=False)
    id_carrera = Column(Integer, ForeignKey("carrera.id_carrera"), nullable=False)
    titulo = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    modalidad = Column(Enum("Presencial", "Virtual", "Hibrida"), nullable=False)
    horario = Column(String(100), nullable=True)
    cupo_total = Column(Integer, nullable=False)
    cupo_disponible = Column(Integer, nullable=False)
    estado_vacante = Column(
        Enum("Pendiente", "Con observaciones", "PrePadron", "Activa", "Rechazada", "Cerrada"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente"
    )
    periodo = Column(Enum("Semestral", "Cuatrimestral"), nullable=True)
    id_tipo_practica = Column(Integer, ForeignKey("tipo_practica.id_tipo_practica"), nullable=True)
    id_convocatoria = Column(Integer, ForeignKey("convocatoria.id_convocatoria"), nullable=True)
    observaciones = Column(Text, nullable=True)

    empresa = relationship("EmpresaModel", back_populates="vacantes")
    carrera = relationship("CarreraModel", back_populates="vacantes")
    tipo_practica = relationship("TipoPracticaModel", back_populates="vacantes")
    convocatoria = relationship("ConvocatoriaModel")
    asignaciones = relationship("AsignacionModel", back_populates="vacante", overlaps="empresa")
