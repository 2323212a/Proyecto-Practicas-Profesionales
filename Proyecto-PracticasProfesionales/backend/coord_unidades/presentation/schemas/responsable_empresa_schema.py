from pydantic import BaseModel


class ResponsableEmpresaCreate(BaseModel):
    id_empresa: int
    nombre_completo: str
    cargo: str | None = None
    correo: str | None = None
    telefono: str | None = None
    activo: bool = True
