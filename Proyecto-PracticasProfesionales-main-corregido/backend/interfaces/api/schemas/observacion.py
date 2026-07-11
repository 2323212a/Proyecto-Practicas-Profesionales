from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ObservacionCreate(BaseModel):
    id_documento: int
    id_usuario: int
    descripcion: str
    tipo_observacion: str


class ObservacionResponse(BaseModel):
    id_observacion: int
    id_documento: int
    id_usuario: int
    descripcion: str
    tipo_observacion: str
    fecha_observacion: datetime

    model_config = ConfigDict(from_attributes=True)
