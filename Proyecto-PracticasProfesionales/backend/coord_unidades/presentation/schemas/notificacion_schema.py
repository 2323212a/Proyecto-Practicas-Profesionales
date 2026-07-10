from datetime import datetime

from pydantic import BaseModel


class NotificacionCreate(BaseModel):
    id_usuario: int | None = None
    titulo: str
    mensaje: str
    tipo: str = "General"


class NotificacionResponse(BaseModel):
    id_notificacion: int
    id_usuario: int | None = None
    titulo: str
    mensaje: str
    tipo: str
    leida: bool
    fecha_envio: datetime | None = None

    class Config:
        orm_mode = True
