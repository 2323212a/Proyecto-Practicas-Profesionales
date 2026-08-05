from sqlalchemy import Boolean, Column, Integer, String, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class UsuarioModel(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    correo = Column(String(150), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    id_rol = Column(Integer, ForeignKey("rol.id_rol"), nullable=False)
    estado = Column(
        Enum("Activo", "Inactivo"),
        nullable=False,
        default="Activo",
        server_default="Activo"
    )
    debe_cambiar_password = Column(Boolean, nullable=False, default=False, server_default="0")
    fecha_cambio_password = Column(DateTime, nullable=True)
    fecha_reset_password = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
    updated_at = Column(DateTime, nullable=True, onupdate=func.now())

    rol = relationship("RolModel", back_populates="usuarios")
    alumno = relationship("AlumnoModel", back_populates="usuario", uselist=False)
    personal_interno = relationship("PersonalInternoModel", back_populates="usuario", uselist=False)
    responsable_empresa = relationship(
        "ResponsableEmpresaModel",
        back_populates="usuario",
        uselist=False
    )
