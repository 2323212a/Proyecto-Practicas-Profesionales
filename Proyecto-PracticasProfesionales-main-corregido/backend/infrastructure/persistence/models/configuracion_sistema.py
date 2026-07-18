from sqlalchemy import Column, DateTime, Enum, Integer, String, Text, func

from infrastructure.database.connection import Base


class ConfiguracionSistemaModel(Base):
    __tablename__ = "configuracion_sistema"

    id_configuracion = Column(Integer, primary_key=True, autoincrement=True)
    nombre_sistema = Column(String(180), nullable=False)
    escuela_facultad = Column(String(180), nullable=True)
    correo_institucional = Column(String(150), nullable=True)
    secretaria_academica = Column(String(180), nullable=True)
    coordinadora_practicas = Column(String(180), nullable=True)
    estado_sistema = Column(
        Enum("Activo", "Mantenimiento", "Suspendido"),
        nullable=False,
        default="Activo",
        server_default="Activo",
    )
    inscripcion_empresas_estado = Column(
        Enum("Abierta", "Cerrada"),
        nullable=False,
        default="Abierta",
        server_default="Abierta",
    )
    ciclo_escolar = Column(String(80), nullable=True)
    hero_titulo = Column(String(200), nullable=True)
    hero_subtitulo = Column(Text, nullable=True)
    soporte_telefono = Column(String(30), nullable=True)
    ultima_actualizacion = Column(DateTime, nullable=True, server_default=func.now(), onupdate=func.now())
