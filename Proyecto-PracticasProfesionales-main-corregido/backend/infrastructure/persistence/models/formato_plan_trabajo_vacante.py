from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class FormatoPlanTrabajoVacanteModel(Base):
    __tablename__ = "formato_plan_trabajo_vacante"

    id_formato_plan = Column(Integer, primary_key=True, autoincrement=True)
    id_convocatoria = Column(Integer, ForeignKey("convocatoria.id_convocatoria"), nullable=True)
    nombre = Column(String(255), nullable=False)
    descripcion = Column(Text, nullable=True)
    nombre_archivo = Column(String(255), nullable=False)
    ruta_archivo = Column(String(500), nullable=False)
    activo = Column(Boolean, nullable=False, default=True, server_default="1")
    fecha_subida = Column(DateTime, nullable=False, server_default=func.now())
    subido_por = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    convocatoria = relationship("ConvocatoriaModel")
    usuario_subio = relationship("UsuarioModel")
