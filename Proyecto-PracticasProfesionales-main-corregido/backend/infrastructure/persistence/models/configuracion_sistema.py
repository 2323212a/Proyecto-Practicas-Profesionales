from sqlalchemy import Column, Date, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class ConfiguracionSistemaModel(Base):
    __tablename__ = "configuracion_sistema"

    id_configuracion = Column(Integer, primary_key=True, autoincrement=True)
    nombre_sistema = Column(String(150), nullable=False)
    escuela_facultad = Column(String(150), nullable=False)
    correo_institucional = Column(String(100), nullable=False)
    estado_sistema = Column(String(30), nullable=False, default="Activo", server_default="Activo")
    ciclo_escolar = Column(String(50), nullable=False)
    hero_titulo = Column(String(150), nullable=False)
    hero_subtitulo = Column(Text, nullable=False)
    id_convocatoria_principal = Column(
        Integer,
        ForeignKey("convocatoria.id_convocatoria"),
        nullable=True,
    )
    convocatoria_nombre = Column(String(120), nullable=False)
    convocatoria_inicio = Column(Date, nullable=True)
    convocatoria_cierre = Column(Date, nullable=True)
    soporte_telefono = Column(String(30), nullable=True)
    ultima_actualizacion = Column(
        DateTime,
        nullable=False,
        server_default=func.now(),
        onupdate=func.now(),
    )

    convocatoria_principal = relationship("ConvocatoriaModel")
