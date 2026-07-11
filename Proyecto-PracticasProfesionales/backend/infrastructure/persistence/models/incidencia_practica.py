from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class IncidenciaPracticaModel(Base):
    __tablename__ = "incidencia_practica"

    id_incidencia = Column(Integer, primary_key=True, autoincrement=True)
    id_asignacion = Column(Integer, ForeignKey("asignacion.id_asignacion"), nullable=False)
    id_usuario_reportante = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False)
    reportante = Column(Enum("Alumno", "Empresa", "Docente", "Coordinacion"), nullable=False)
    tipo_incidencia = Column(String(80), nullable=False)
    prioridad = Column(Enum("Baja", "Media", "Alta"), nullable=False, default="Media", server_default="Media")
    descripcion = Column(Text, nullable=False)
    estado = Column(
        Enum("Abierta", "En seguimiento", "Resuelta", "Cerrada"),
        nullable=False,
        default="Abierta",
        server_default="Abierta",
    )
    respuesta_coordinacion = Column(Text, nullable=True)
    fecha_reporte = Column(DateTime, nullable=False, server_default=func.now())
    fecha_actualizacion = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    asignacion = relationship("AsignacionModel")
    usuario_reportante = relationship("UsuarioModel")
