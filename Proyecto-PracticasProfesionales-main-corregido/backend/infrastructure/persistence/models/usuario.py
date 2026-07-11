from sqlalchemy import Column, Integer, String, DateTime, Enum, ForeignKey, func
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class UsuarioModel(Base):
    __tablename__ = "usuario"

    id_usuario = Column(Integer, primary_key=True, autoincrement=True)
    id_rol = Column(Integer, ForeignKey("rol.id_rol"), nullable=False)
    nombre = Column(String(100), nullable=False)
    apellido_paterno = Column(String(50))
    apellido_materno = Column(String(50))
    correo = Column(String(100), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=False)
    estado = Column(
        Enum("Activo", "Inactivo"),
        nullable=False,
        default="Activo",
        server_default="Activo"
    )
    fecha_registro = Column(DateTime, nullable=False, server_default=func.now())

    rol = relationship("RolModel", back_populates="usuarios")
    alumno = relationship("AlumnoModel", back_populates="usuario", uselist=False)
    docente = relationship("DocenteAsesorModel", back_populates="usuario", uselist=False)
    coordinador = relationship("CoordinadorModel", back_populates="usuario", uselist=False)
    responsable_empresa = relationship(
        "ResponsableEmpresaModel",
        back_populates="usuario",
        uselist=False
    )
