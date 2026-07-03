from pydantic import BaseModel, EmailStr


class LoginRequest(BaseModel):
    correo: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"

    id_usuario: int
    id_rol: int

    nombre: str
    apellido_paterno: str | None = None
    apellido_materno: str | None = None

    correo: EmailStr