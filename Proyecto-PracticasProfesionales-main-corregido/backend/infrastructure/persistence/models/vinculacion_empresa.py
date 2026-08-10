from sqlalchemy import Boolean, CheckConstraint, Column, Date, DateTime, Enum, ForeignKey, Integer, Text, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class VinculacionEmpresaModel(Base):
    __tablename__ = "vinculacion_empresa"
    __table_args__ = (
        CheckConstraint("fecha_fin IS NULL OR fecha_inicio IS NULL OR fecha_fin >= fecha_inicio", name="chk_vinculacion_fechas"),
    )

    id_vinculacion = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"), nullable=False)
    estado_vinculacion = Column(
        Enum("Pendiente", "Aprobada", "Por vencer", "Vencida", "Rechazada"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente",
    )
    fecha_inicio = Column(Date, nullable=True)
    fecha_fin = Column(Date, nullable=True)
    es_actual = Column(Boolean, nullable=False, default=True, server_default="1")
    observaciones = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=False, server_default=func.now(), onupdate=func.now())

    empresa = relationship("EmpresaModel", back_populates="vinculaciones")
