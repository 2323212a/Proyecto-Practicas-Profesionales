from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, Text, UniqueConstraint, func
from sqlalchemy.orm import relationship

from infrastructure.database.connection import Base


class RequisitoEmpresaTipoUnidadModel(Base):
    __tablename__ = "requisito_empresa_tipo_unidad"
    __table_args__ = (
        UniqueConstraint(
            "id_tipo_unidad_receptora",
            "id_tipo_documento_empresa",
            name="uq_requisito_empresa_tipo_unidad",
        ),
    )

    id_requisito_empresa_tipo_unidad = Column(Integer, primary_key=True, autoincrement=True)
    id_tipo_unidad_receptora = Column(
        Integer,
        ForeignKey("tipo_unidad_receptora.id_tipo_unidad_receptora"),
        nullable=False,
    )
    id_tipo_documento_empresa = Column(
        Integer,
        ForeignKey("tipo_documento_empresa.id_tipo_documento_empresa"),
        nullable=False,
    )
    obligatorio = Column(Boolean, nullable=False, default=True, server_default="1")
    activo = Column(Boolean, nullable=False, default=True, server_default="1")
    orden = Column(Integer, nullable=False, default=0, server_default="0")
    instrucciones = Column(Text, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    tipo_unidad_receptora = relationship("TipoUnidadReceptoraModel", back_populates="requisitos")
    tipo_documento = relationship("TipoDocumentoEmpresaModel")
