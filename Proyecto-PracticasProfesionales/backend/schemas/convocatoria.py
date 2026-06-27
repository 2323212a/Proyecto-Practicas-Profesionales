from datetime import date
from pydantic import BaseModel, ConfigDict


class ConvocatoriaCreate(BaseModel):
    nombre: str
    periodo: str
    fecha_inicio: date
    fecha_fin: date
    estado: str = "Activa"


class ConvocatoriaResponse(BaseModel):
    id_convocatoria: int
    nombre: str
    periodo: str
    fecha_inicio: date
    fecha_fin: date
    estado: str

    model_config = ConfigDict(
        from_attributes=True
    )

class ConvocatoriaUpdate(BaseModel):
    nombre: str | None = None
    periodo: str | None = None
    fecha_inicio: date | None = None
    fecha_fin: date | None = None
    estado: str = "Activa"