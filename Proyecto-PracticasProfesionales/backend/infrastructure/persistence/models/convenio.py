from sqlalchemy import CheckConstraint, Column, Date, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class ConvenioModel(Base):
    __tablename__ = "convenio"
    __table_args__ = (
        CheckConstraint("fecha_fin >= fecha_inicio", name="chk_convenio_fechas"),
    )

    id_convenio = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"), nullable=False)
    fecha_inicio = Column(Date, nullable=False)
    fecha_fin = Column(Date, nullable=False)
    documento_convenio = Column(String(255), nullable=True)
    estado_convenio = Column(
        Enum("Vigente", "Vencido", "Pendiente"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente"
    )

    empresa = relationship("EmpresaModel", back_populates="convenios")
