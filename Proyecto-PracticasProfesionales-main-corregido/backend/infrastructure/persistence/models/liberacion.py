from sqlalchemy import Column, DateTime, Enum, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class LiberacionModel(Base):
    __tablename__ = "liberacion_practica"

    id_liberacion = Column(Integer, primary_key=True, autoincrement=True)
    id_asignacion = Column(Integer, ForeignKey("asignacion.id_asignacion"), nullable=False, unique=True)
    fecha_liberacion = Column(DateTime, nullable=True)
    documento_liberacion = Column(String(500), nullable=True)
    estado_liberacion = Column(
        Enum("Pendiente", "Emitida"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente",
    )
    observaciones = Column(Text, nullable=True)
    emitido_por = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    asignacion = relationship("AsignacionModel", back_populates="liberacion")
