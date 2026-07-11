from sqlalchemy import Column, ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class ResponsableEmpresaModel(Base):
    __tablename__ = "responsable_empresa"
    __table_args__ = (
        UniqueConstraint("id_empresa", "id_usuario", name="uq_responsable_empresa_usuario"),
    )

    id_responsable = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False, unique=True)
    cargo = Column(String(100), nullable=True)
    telefono = Column(String(15), nullable=True)

    empresa = relationship("EmpresaModel", back_populates="responsables")
    usuario = relationship("UsuarioModel", back_populates="responsable_empresa")
