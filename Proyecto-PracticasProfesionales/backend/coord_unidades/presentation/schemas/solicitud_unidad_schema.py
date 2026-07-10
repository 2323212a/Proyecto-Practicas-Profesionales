import re

from pydantic import BaseModel, field_validator


RFC_PATTERN = re.compile(r"^[A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3}$")
TELEFONO_PATTERN = re.compile(r"^\+?[0-9]{7,15}$")
CORREO_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class SolicitudUnidadRequest(BaseModel):
    nombre_empresa: str
    rfc: str
    giro: str
    domicilio: str
    telefono: str
    correo_contacto: str

    @field_validator(
        "nombre_empresa",
        "rfc",
        "giro",
        "domicilio",
        "telefono",
        mode="before",
    )
    @classmethod
    def limpiar_texto(cls, value):
        if not isinstance(value, str):
            raise ValueError("El campo es obligatorio")

        value = value.strip()

        if not value:
            raise ValueError("El campo es obligatorio")

        return value

    @field_validator("correo_contacto", mode="before")
    @classmethod
    def limpiar_correo(cls, value):
        if not isinstance(value, str):
            raise ValueError("El correo es obligatorio")

        value = value.strip()

        if not value:
            raise ValueError("El correo es obligatorio")

        return value

    @field_validator("correo_contacto")
    @classmethod
    def validar_correo(cls, value: str):
        if not CORREO_PATTERN.match(value):
            raise ValueError("Correo electronico invalido")

        return value

    @field_validator("rfc")
    @classmethod
    def validar_rfc(cls, value: str):
        value = value.upper()

        if not RFC_PATTERN.match(value):
            raise ValueError("RFC invalido")

        return value

    @field_validator("telefono")
    @classmethod
    def validar_telefono(cls, value: str):
        telefono = value.replace(" ", "").replace("-", "")

        if not TELEFONO_PATTERN.match(telefono):
            raise ValueError("Telefono invalido")

        return telefono


SolicitudUnidadCreate = SolicitudUnidadRequest


class SolicitudUnidadResponse(BaseModel):
    success: bool
    message: str
    id_empresa: int
    id_solicitud: int


class SolicitudUnidadRechazoRequest(BaseModel):
    motivo_rechazo: str
    observaciones: str

    @field_validator("motivo_rechazo", "observaciones", mode="before")
    @classmethod
    def limpiar_texto_obligatorio(cls, value):
        if not isinstance(value, str):
            raise ValueError("El campo es obligatorio")

        value = value.strip()

        if not value:
            raise ValueError("El campo es obligatorio")

        return value


class SolicitudUnidadListadoResponse(BaseModel):
    id_solicitud: int
    id_empresa: int
    nombre_empresa: str
    rfc: str
    giro: str
    telefono: str | None = None
    correo_contacto: str | None = None
    estado: str
    fecha_solicitud: str | None = None
