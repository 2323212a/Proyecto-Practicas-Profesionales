from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class VacanteModel(Base):
    __tablename__ = "vacante"
    __table_args__ = (
        UniqueConstraint("id_empresa", "id_convocatoria", name="uq_vacante_empresa_convocatoria"),
    )

    id_vacante = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"), nullable=False)
    id_convocatoria = Column(Integer, ForeignKey("convocatoria.id_convocatoria"), nullable=False)
    id_tipo_practica = Column(Integer, ForeignKey("tipo_practica.id_tipo_practica"), nullable=False)
    titulo = Column(String(100), nullable=False)
    descripcion = Column(Text, nullable=True)
    actividades = Column(Text, nullable=True)
    requisitos = Column(Text, nullable=True)
    cupos = Column(Integer, nullable=False)
    aplica_todas_carreras = Column(Boolean, nullable=False, default=False, server_default="0")
    periodo = Column(Enum("Semestral", "Cuatrimestral"), nullable=False)
    estado_vacante = Column(
        Enum("Pendiente", "Con observaciones", "PrePadron", "Activa", "Rechazada", "Cerrada"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente"
    )
    observaciones = Column(Text, nullable=True)
    fecha_creacion = Column(DateTime, nullable=False, server_default=func.now())
    fecha_revision = Column(DateTime, nullable=True)
    revisada_por = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    empresa = relationship("EmpresaModel", back_populates="vacantes")
    tipo_practica = relationship("TipoPracticaModel", back_populates="vacantes")
    convocatoria = relationship("ConvocatoriaModel")
    asignaciones = relationship("AsignacionModel", back_populates="vacante", overlaps="empresa")
    tipos_practica_config = relationship("VacanteTipoPracticaModel", back_populates="vacante")
    carreras_config = relationship("VacanteCarreraModel", back_populates="vacante")
    solicitudes_ampliacion = relationship("SolicitudAmpliacionCuposVacanteModel", back_populates="vacante")
    documentos = relationship("DocumentoVacanteModel", back_populates="vacante")
