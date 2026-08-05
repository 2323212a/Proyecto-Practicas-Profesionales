from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, UniqueConstraint, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class ResponsableEmpresaModel(Base):
    __tablename__ = "responsable_empresa"
    __table_args__ = (
        UniqueConstraint("id_empresa", "id_usuario", name="uq_responsable_empresa_usuario"),
    )

    id_responsable = Column(Integer, primary_key=True, autoincrement=True)
    id_empresa = Column(Integer, ForeignKey("empresa.id_empresa"), nullable=False)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=True, unique=True)
    nombre = Column(String(120), nullable=False)
    apellido_paterno = Column(String(120), nullable=False)
    apellido_materno = Column(String(120), nullable=True)
    cargo = Column(String(150), nullable=True)
    telefono = Column(String(30), nullable=True)
    correo = Column(String(150), nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    empresa = relationship("EmpresaModel", back_populates="responsables")
    usuario = relationship("UsuarioModel", back_populates="responsable_empresa")
