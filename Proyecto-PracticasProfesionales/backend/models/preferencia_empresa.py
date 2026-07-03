from sqlalchemy import Column, Integer, DateTime, Enum, Boolean, func
from database.connection import Base


class PreferenciaEmpresaModel(Base):
    __tablename__ = "preferencia_empresa"

    id_preferencia = Column(Integer, primary_key=True, autoincrement=True)
    id_alumno = Column(Integer, nullable=False)
    id_empresa = Column(Integer, nullable=False)
    id_vacante = Column(Integer, nullable=False)
    orden_preferencia = Column(Integer, nullable=False)
    prioritaria = Column(Boolean, default=False)
    estado_preferencia = Column(
        Enum("Pendiente", "Aprobada", "Rechazada", "Cancelada"),
        default="Pendiente",
        nullable=False,
    )
    fecha_registro = Column(DateTime, server_default=func.now())
    fecha_actualizacion = Column(DateTime, server_default=func.now(), onupdate=func.now())