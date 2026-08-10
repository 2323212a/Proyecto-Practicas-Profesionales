from sqlalchemy import Column, Integer, String, Text

from infrastructure.database.connection import Base


class InstitucionPracticasModel(Base):
    __tablename__ = 'instituciones_practicas'

    id = Column(Integer, primary_key=True, autoincrement=True)
    nombre_institucion = Column(String(255), nullable=False)
    rfc = Column(String(13), nullable=False)
    telefono_institucional = Column(String(50), nullable=False)
    correo_institucional = Column(String(150), nullable=False)
    tipo_unidad = Column(String(100), nullable=True)
    domicilio = Column(String(255), nullable=True)
    horario_atencion = Column(String(100), nullable=True)
    nombre_contacto = Column(String(150), nullable=True)
    cargo_contacto = Column(String(100), nullable=True)
    area_contacto = Column(String(100), nullable=True)
    telefono_contacto = Column(String(50), nullable=True)
    correo_contacto = Column(String(150), nullable=True)
    areas_receptoras = Column(Text, nullable=True)
    numero_estudiantes = Column(Integer, nullable=True)
    perfil_academico = Column(Text, nullable=True)
    actividades = Column(Text, nullable=True)
    horario_practicas = Column(String(100), nullable=True)
    modalidad = Column(String(50), nullable=True)
    documento_pdf = Column(String(255), nullable=True)
    municipio = Column(String(100), nullable=True)
    estado = Column(String(100), nullable=True)
    estatus = Column(String(50), nullable=True, default='Activo', server_default='Activo')
    observaciones = Column(Text, nullable=True)
    carta_colaboracion = Column(String(255), nullable=True)
