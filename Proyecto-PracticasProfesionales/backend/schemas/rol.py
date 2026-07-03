from pydantic import BaseModel, ConfigDict


class RolCreate(BaseModel):
    nombre: str
    descripcion: str | None = None


class RolResponse(BaseModel):
    id_rol: int
    nombre: str
    descripcion: str | None = None

    model_config = ConfigDict(from_attributes=True)