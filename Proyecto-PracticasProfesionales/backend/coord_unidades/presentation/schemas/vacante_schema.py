from datetime import datetime

from pydantic import BaseModel


class VacanteResponse(BaseModel):
    id_vacante: int
    id_empresa: int
    id_carrera: int | None = None
    titulo: str | None = None
    descripcion: str | None = None
    modalidad: str | None = None
    cupo_total: int | None = None
    cupo_disponible: int | None = None
    estado_vacante: str
    fecha_publicacion: datetime | None = None

    class Config:
        orm_mode = True
