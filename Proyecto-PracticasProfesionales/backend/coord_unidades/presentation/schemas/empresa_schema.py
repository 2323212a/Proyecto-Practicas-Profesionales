from datetime import datetime

from pydantic import BaseModel, EmailStr


class EmpresaResponse(BaseModel):
    id_empresa: int
    id_usuario: int | None = None
    nombre_empresa: str
    rfc: str
    giro: str
    domicilio: str
    telefono: str | None = None
    correo_contacto: EmailStr | None = None
    estado_empresa: str
    fecha_registro: datetime | None = None
    fecha_validacion: datetime | None = None

    class Config:
        orm_mode = True
