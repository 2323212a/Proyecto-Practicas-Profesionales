from sqlalchemy import Column, Integer, String, Text, Enum, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database.connection import Base
from datetime import datetime


class EmpresaModel(Base):
    __tablename__ = "empresa"

    id_empresa = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"))

    nombre_empresa = Column(String(150), nullable=False)
    rfc = Column(String(20), nullable=False)
    giro = Column(String(100), nullable=False)
    domicilio = Column(Text, nullable=False)
    telefono = Column(String(15))
    correo_contacto = Column(String(100))

    estado_empresa = Column(
        Enum(
            "Pendiente",
            "En Revision",
            "Aprobada",
            "Rechazada",
            "Suspendida",
            "Inactiva"
        ),
        default="Pendiente"
    )

    fecha_registro = Column(DateTime, default=datetime.utcnow)
    fecha_validacion = Column(DateTime, nullable=True)

    responsables = relationship("ResponsableEmpresaModel", back_populates="empresa")
    convenios = relationship("ConvenioModel", back_populates="empresa")
    vacantes = relationship("VacanteModel", back_populates="empresa")
    documentos = relationship("DocumentoEmpresaModel", back_populates="empresa")
