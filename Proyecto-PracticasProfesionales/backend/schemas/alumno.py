from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AlumnoCreate(BaseModel):
    id_usuario: int
    id_carrera: int
    matricula: str
    semestre: int | None = None
    grupo: str | None = None
    creditos_aprobados: int = 0
    estado_alumno: str = "Activo"


class AlumnoResponse(BaseModel):
    id_alumno: int
    id_usuario: int
    id_carrera: int
    matricula: str
    semestre: int | None = None
    grupo: str | None = None
    creditos_aprobados: int
    estado_alumno: str

    model_config = ConfigDict(from_attributes=True)


class AlumnoPerfilResponse(BaseModel):
    id_usuario: int
    id_alumno: int
    id_rol: int
    nombre: str
    apellido_paterno: str | None = None
    apellido_materno: str | None = None
    correo: str
    estado_usuario: str | None = None
    fecha_registro: datetime | None = None
    matricula: str
    semestre: int | None = None
    grupo: str | None = None
    creditos_aprobados: int
    estado_alumno: str
    id_carrera: int
    carrera_clave: str | None = None
    carrera_nombre: str | None = None