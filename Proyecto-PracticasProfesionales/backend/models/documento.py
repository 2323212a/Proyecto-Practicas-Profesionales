from sqlalchemy import Column, Integer, String, DateTime, Enum, Boolean, func
from database.connection import Base


class DocumentoModel(Base):
    __tablename__ = "documento"

    id_documento = Column(Integer, primary_key=True, autoincrement=True)

    id_expediente = Column(Integer, nullable=False)
    id_tipo_documento = Column(Integer, nullable=False)

    nombre_archivo = Column(String(255), nullable=True)
    ruta_archivo = Column(String(255), nullable=True)

    estado_documento = Column(
        Enum("Pendiente", "Aprobado", "Observado", "Rechazado"),
        default="Pendiente"
    )

    fecha_carga = Column(DateTime, server_default=func.now())

    generado_por_sistema = Column(Boolean, default=False)
    requiere_validacion_automatica = Column(Boolean, default=False)

    validacion_automatica_estado = Column(
        Enum("No validado", "Prevalidado", "No valido", "Revision manual"),
        default="No validado"
    )

    fecha_validacion_automatica = Column(DateTime, nullable=True)