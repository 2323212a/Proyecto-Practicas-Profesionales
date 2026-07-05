from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer
from sqlalchemy import String, Text, func
from sqlalchemy.orm import relationship

from database.connection import Base


class TipoDocumentoEmpresaModel(Base):
    __tablename__ = "tipo_documento_empresa"

    id_tipo_documento_empresa = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    nombre_documento = Column(String(100), nullable=False)
    descripcion = Column(Text)
    obligatorio = Column(Boolean, nullable=False, default=True)
    tipo_proceso = Column(Enum("Alta", "Renovacion"))


class DocumentoEmpresaModel(Base):
    __tablename__ = "documento_empresa"

    id_documento_empresa = Column(
        Integer,
        primary_key=True,
        autoincrement=True,
    )
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"))
    id_tipo_documento_empresa = Column(
        Integer, ForeignKey("tipo_documento_empresa.id_tipo_documento_empresa"),
    )

    nombre_archivo = Column(String(255))
    ruta_archivo = Column(String(255))
    estado_documento = Column(
        Enum(
            "Pendiente",
            "Aprobado",
            "Observado",
            "Rechazado",
        ),
        default="Pendiente",
    )
    fecha_carga = Column(DateTime, server_default=func.now())

    empresa = relationship("EmpresaModel", back_populates="documentos")
