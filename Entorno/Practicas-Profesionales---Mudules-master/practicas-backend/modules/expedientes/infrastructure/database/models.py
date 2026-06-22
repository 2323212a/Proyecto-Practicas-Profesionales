from sqlalchemy.orm import declarative_base
from sqlalchemy import (
    Boolean,
    Column,
    DateTime,
    Enum,
    Integer,
    String,
    func,
)

Base = declarative_base()


class DocumentoModel(Base):
    __tablename__ = "documento"

    id_documento = Column(
        Integer,
        primary_key=True,
        autoincrement=True
    )

    id_expediente = Column(
        Integer
    )

    id_tipo_documento = Column(
        Integer
    )

    nombre_archivo = Column(String(255))
    ruta_archivo = Column(String(255))

    estado_documento = Column(
        Enum(
            "Pendiente",
            "Aprobado",
            "Observado",
            "Rechazado"
        ),
        default="Pendiente"
    )

    fecha_carga = Column(
        DateTime,
        nullable=False,
        server_default=func.now()
    )

    generado_por_sistema = Column(
        Boolean,
        nullable=False,
        default=False,
        server_default="0"
    )
