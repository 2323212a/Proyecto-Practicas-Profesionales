from sqlalchemy import Boolean, Column, DateTime, Integer, String, Text, UniqueConstraint, func

from infrastructure.database.connection import Base


class RegistroIdentidadImportacionModel(Base):
    __tablename__ = "registro_identidad_importacion"
    __table_args__ = (
        UniqueConstraint("tipo_entidad", "id_entidad", name="uq_registro_identidad_tipo_id"),
    )

    id_registro_identidad = Column(Integer, primary_key=True, autoincrement=True)
    tipo_entidad = Column(String(20), nullable=False, index=True)
    id_entidad = Column(Integer, nullable=False)
    matricula = Column(String(50), nullable=True, index=True)
    rfc = Column(String(100), nullable=True, index=True)
    correo = Column(String(150), nullable=True, index=True)
    nombre = Column(String(300), nullable=True, index=True)
    datos_json = Column(Text, nullable=True)
    fecha_archivo = Column(DateTime, nullable=False, server_default=func.now())
    fecha_reutilizacion = Column(DateTime, nullable=True)
    activo = Column(Boolean, nullable=False, default=True, server_default="1")
