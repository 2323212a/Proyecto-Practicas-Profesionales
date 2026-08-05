from sqlalchemy import CheckConstraint, Column, Enum, ForeignKey, Integer, String
from sqlalchemy.orm import relationship
from infrastructure.database.connection import Base


class AlumnoModel(Base):
    __tablename__ = "alumno"
    __table_args__ = (
        CheckConstraint("semestre IS NULL OR semestre BETWEEN 1 AND 12", name="chk_alumno_semestre"),
    )

    id_alumno = Column(Integer, primary_key=True, autoincrement=True)
    id_usuario = Column(Integer, ForeignKey("usuario.id_usuario"), nullable=False, unique=True)
    nombre = Column(String(120), nullable=False)
    apellido_paterno = Column(String(120), nullable=False)
    apellido_materno = Column(String(120), nullable=True)
    id_carrera = Column(Integer, ForeignKey("carrera.id_carrera"), nullable=False)
    id_tipo_practica = Column(
        Integer,
        ForeignKey("tipo_practica.id_tipo_practica", ondelete="SET NULL", onupdate="CASCADE"),
        nullable=True,
    )
    periodo_practica = Column(Enum("Semestral", "Cuatrimestral"), nullable=False)
    matricula = Column(String(50), nullable=False, unique=True)
    semestre = Column(Integer, nullable=False)
    grupo = Column(String(20), nullable=True)
    creditos_aprobados = Column(Integer, nullable=False, default=0, server_default="0")
    telefono = Column(String(30), nullable=True)
    estado_alumno = Column(
        Enum(
            "Activo",
            "Inactivo",
            "Egresado",
            "Baja"
        ),
        nullable=False,
        default="Activo",
        server_default="Activo"
    )

    usuario = relationship("UsuarioModel", back_populates="alumno")
    carrera = relationship("CarreraModel", back_populates="alumnos")
    tipo_practica = relationship("TipoPracticaModel")
    expedientes = relationship("ExpedienteModel", back_populates="alumno")
    selecciones_empresa = relationship("SeleccionEmpresaModel", back_populates="alumno")
    asignaciones = relationship("AsignacionModel", back_populates="alumno")
