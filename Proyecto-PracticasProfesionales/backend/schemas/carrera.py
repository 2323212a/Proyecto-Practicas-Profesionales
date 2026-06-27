from pydantic import BaseModel, ConfigDict


class CarreraCreate(BaseModel):
    clave: str
    nombre: str


class CarreraResponse(BaseModel):
    id_carrera: int
    clave: str
    nombre: str

    model_config = ConfigDict(
        from_attributes=True
    )

class CarreraUpdate(BaseModel):
    clave: str
    nombre: str