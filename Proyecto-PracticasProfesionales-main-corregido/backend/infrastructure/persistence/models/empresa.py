from sqlalchemy import Column, Enum, Integer, String, Text
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
    estado_empresa = Column(
        Enum("Solicitante", "Pendiente", "Rechazada", "Activa", "Suspendida", "Inactiva"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente"
    )
    tipo_tramite = Column(Enum("Convenio", "Vinculacion"), nullable=True)
    periodo_participacion = Column(Enum("Semestral", "Cuatrimestral", "Ambos"), nullable=True)

    responsables = relationship("ResponsableEmpresaModel", back_populates="empresa")
    solicitudes = relationship("SolicitudEmpresaModel", back_populates="empresa")
    convenios = relationship("ConvenioModel", back_populates="empresa")
    vacantes = relationship("VacanteModel", back_populates="empresa")
    selecciones = relationship("SeleccionEmpresaModel", back_populates="empresa")
    asignaciones = relationship("AsignacionModel", back_populates="empresa", overlaps="asignaciones,vacante")
