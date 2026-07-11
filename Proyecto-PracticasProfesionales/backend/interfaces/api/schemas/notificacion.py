from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificacionCreate(BaseModel):
    id_usuario: int
    titulo: str
    mensaje: str


class NotificacionUpdate(BaseModel):
    leida: bool


class NotificacionResponse(BaseModel):
    id_notificacion: int
    id_usuario: int
    titulo: str
    mensaje: str
    leida: bool
    fecha_envio: datetime

    model_config = ConfigDict(from_attributes=True)
