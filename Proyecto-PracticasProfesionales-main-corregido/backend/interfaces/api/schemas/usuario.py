from __future__ import annotations
from pydantic import BaseModel, EmailStr, ConfigDict, Field


class UsuarioCreate(BaseModel):
    id_rol: int
    nombre: str
    apellido_paterno: str | None = None
    apellido_materno: str | None = None
    correo: EmailStr
    password: str = Field(min_length=6, max_length=72)
    id_carrera: int | None = None
    id_tipo_practica: int | None = None
    matricula: str | None = None
    semestre: int | None = Field(default=None, ge=1)
    grupo: str | None = None
    creditos_aprobados: int | None = Field(default=0, ge=0)
    periodo_practica: str | None = None
    departamento: str | None = None
    cargo: str | None = None
    telefono: str | None = None


class UsuarioResponse(BaseModel):
    id_usuario: int
    id_rol: int
    rol: str | None = None
    nombre: str | None = None
    apellido_paterno: str | None = None
    apellido_materno: str | None = None
    correo: str
    estado: str
    debe_cambiar_password: bool = False
    tipo_perfil: str = "SinPerfil"
    id_perfil: int | None = None
    puede_eliminar_definitivamente: bool = False
    relaciones: list[str] = Field(default_factory=list)
    correo_enviado: bool | None = None
    advertencia_correo: str | None = None

    model_config = ConfigDict(
        from_attributes=True
    )

class UsuarioUpdate(BaseModel):
    nombre: str
    apellido_paterno: str | None = None
    apellido_materno: str | None = None
    correo: EmailStr
    estado: str
    id_rol: int | None = None


class UsuarioEstadoUpdate(BaseModel):
    estado: str
