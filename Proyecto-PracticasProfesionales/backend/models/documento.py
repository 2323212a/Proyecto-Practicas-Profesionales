from sqlalchemy import Boolean, Column, DateTime, Enum, Integer, String, func
from database.connection import Base


class DocumentoModel(Base):
    __tablename__ = "documento"

    id_documento = Column(Integer, primary_key=True, autoincrement=True)

    id_expediente = Column(Integer, nullable=False)
    id_tipo_documento = Column(Integer, nullable=False)

    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(255), nullable=False)

    estado_documento = Column(
        Enum("Pendiente", "Aprobado", "Observado", "Rechazado"),
        default="Pendiente",
        nullable=False
    )

    fecha_carga = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    generado_por_sistema = Column(
        Boolean,
        nullable=False,
        default=False
    )