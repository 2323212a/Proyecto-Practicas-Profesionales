from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UsuarioCreate(BaseModel):
    id_rol: int

    nombre: str

    apellido_paterno: str | None = None
    apellido_materno: str | None = None

    correo: EmailStr

    password: str = Field(min_length=6, max_length=72)


class UsuarioResponse(BaseModel):
    id_usuario: int

    id_rol: int

    nombre: str

    apellido_paterno: str | None = None
    apellido_materno: str | None = None

    correo: str

    estado: str

    model_config = ConfigDict(
        from_attributes=True
    )

class UsuarioUpdate(BaseModel):
    id_rol: int
    nombre: str
    apellido_paterno: str | None = None
    apellido_materno: str | None = None
    correo: EmailStr
    estado: str