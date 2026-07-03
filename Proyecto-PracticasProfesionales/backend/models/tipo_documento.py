from sqlalchemy import Column, Integer, String, Text, Boolean
from database.connection import Base


class TipoDocumentoModel(Base):
    __tablename__ = "tipo_documento"

    id_tipo_documento = Column(Integer, primary_key=True, autoincrement=True)
    nombre_documento = Column(String(100), nullable=True)
    descripcion = Column(Text, nullable=True)
    etapa = Column(String(50), nullable=True)
    obligatorio = Column(Boolean, default=True)