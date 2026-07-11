from sqlalchemy import CheckConstraint, Column, Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class LiberacionModel(Base):
    __tablename__ = "liberacion"
    __table_args__ = (
        CheckConstraint(
            "estado_liberacion = 'Pendiente' OR "
            "(fecha_liberacion IS NOT NULL AND documento_liberacion IS NOT NULL)",
            name="chk_liberacion_documento"
        ),
    )

    id_liberacion = Column(Integer, primary_key=True, autoincrement=True)
    id_asignacion = Column(Integer, ForeignKey("asignacion.id_asignacion"), nullable=False, unique=True)
    fecha_liberacion = Column(Date, nullable=True)
    documento_liberacion = Column(String(255), nullable=True)
    estado_liberacion = Column(
        Enum("Pendiente", "Emitida"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente"
    )
    observaciones = Column(Text, nullable=True)

    asignacion = relationship("AsignacionModel", back_populates="liberacion")
