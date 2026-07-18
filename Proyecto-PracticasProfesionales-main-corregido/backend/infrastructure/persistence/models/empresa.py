from sqlalchemy import Column, DateTime, Enum, Integer, String, Text, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class EmpresaModel(Base):
    __tablename__ = "empresa"

    id_empresa = Column(Integer, primary_key=True, autoincrement=True)
    nombre_empresa = Column(String(150), nullable=False)
    rfc = Column(String(20), nullable=True, unique=True)
    giro = Column(String(100), nullable=True)
    domicilio = Column(Text, nullable=True)
    telefono = Column(String(15), nullable=True)
    correo_contacto = Column(String(100), nullable=True)
    tipo_tramite = Column(Enum("Convenio", "Vinculacion"), nullable=False)
    estado_empresa = Column(
        Enum("Solicitante", "Pendiente", "Rechazada", "Activa", "Suspendida", "Inactiva"),
        nullable=False,
        default="Solicitante",
        server_default="Solicitante"
    )
    fecha_registro = Column(DateTime, nullable=False, server_default=func.now())
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    responsables = relationship("ResponsableEmpresaModel", back_populates="empresa")
    solicitudes = relationship("SolicitudEmpresaModel", back_populates="empresa")
    convenios = relationship("ConvenioModel", back_populates="empresa")
    vinculaciones = relationship("VinculacionEmpresaModel", back_populates="empresa")
    participaciones = relationship("ParticipacionEmpresaConvocatoriaModel", back_populates="empresa")
    vacantes = relationship("VacanteModel", back_populates="empresa")
    asignaciones = relationship("AsignacionModel", back_populates="empresa", overlaps="asignaciones,vacante")
