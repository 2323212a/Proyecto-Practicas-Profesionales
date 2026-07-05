from sqlalchemy import Column, Date, Enum, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database.connection import Base


class ConvenioModel(Base):
    __tablename__ = "convenio"

    id_convenio = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"))

    fecha_inicio = Column(Date)
    fecha_fin = Column(Date)
    documento_convenio = Column(String(255))
    tipo_convenio = Column(String(50))
    estado_convenio = Column(
        Enum("Vigente", "Vencido", "Pendiente"),
        default="Pendiente",
    )
    observaciones = Column(Text)

    empresa = relationship("EmpresaModel", back_populates="convenios")
