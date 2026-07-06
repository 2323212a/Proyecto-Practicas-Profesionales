from sqlalchemy import Column, Integer, String, ForeignKey
from database.connection import Base


class ResponsableEmpresaModel(Base):
    __tablename__ = "responsable_empresa"

    id_responsable = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"), nullable=False)

    nombre_completo = Column(String(150), nullable=True)
    cargo = Column(String(100), nullable=True)
    correo = Column(String(100), nullable=True)
    telefono = Column(String(15), nullable=True)