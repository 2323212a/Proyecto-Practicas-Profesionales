from sqlalchemy import Boolean, CheckConstraint, Column, Date, Enum, ForeignKey, Integer, String
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
    id_documento_empresa = Column(Integer, ForeignKey("documento_empresa.id_documento_empresa"), nullable=True)
    version = Column(Integer, nullable=False, default=1, server_default="1")
    es_actual = Column(Boolean, nullable=False, default=True, server_default="1")
    renovacion_solicitada = Column(Boolean, nullable=False, default=False, server_default="0")
    estado_convenio = Column(
        Enum("Vigente", "Vencido", "Pendiente"),
        nullable=False,
        default="Pendiente",
        server_default="Pendiente"
    )

    empresa = relationship("EmpresaModel", back_populates="convenios")
    documento_empresa = relationship("DocumentoEmpresaModel")
