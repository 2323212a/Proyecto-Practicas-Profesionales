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