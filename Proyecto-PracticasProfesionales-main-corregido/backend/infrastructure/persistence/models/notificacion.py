from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class NotificacionModel(Base):
    __tablename__ = "notificacion"

    id_notificacion = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    titulo = Column(String(150), nullable=False)
    mensaje = Column(Text, nullable=False)
    tipo = Column(
        Enum("Info", "Exito", "Advertencia", "Error", "Accion"),
        nullable=False,
        default="Info",
        server_default="Info",
    )
    categoria = Column(
        Enum(
            "Sistema",
            "Empresa",
            "Alumno",
            "Documento",
            "Convenio",
            "Vinculacion",
            "Vacante",
            "Convocatoria",
            "Asignacion",
            "Seguimiento",
            "Incidencia",
            "Liberacion",
            "Reporte",
            "Evaluacion",
        ),
        nullable=False,
        default="Sistema",
        server_default="Sistema",
    )
    prioridad = Column(
        Enum("Baja", "Media", "Alta", "Critica"),
        nullable=False,
        default="Media",
        server_default="Media",
    )
    modulo = Column(String(80), nullable=True)
    entidad = Column(String(80), nullable=True)
    id_entidad = Column(Integer, nullable=True)
    url_destino = Column(String(255), nullable=True)
    requiere_accion = Column(Boolean, nullable=False, default=False, server_default="0")
    estado_accion = Column(Enum("Pendiente", "Atendida", "Descartada"), nullable=True)
    leida = Column(Boolean, nullable=False, default=False, server_default="0")
    fecha_creacion = Column(DateTime, nullable=False, server_default=func.now())
    fecha_lectura = Column(DateTime, nullable=True)
    enviada_correo = Column(Boolean, nullable=False, default=False, server_default="0")
    fecha_envio_correo = Column(DateTime, nullable=True)
    error_correo = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    usuario = relationship("UsuarioModel")

    @property
    def fecha_envio(self):
        return self.fecha_creacion
