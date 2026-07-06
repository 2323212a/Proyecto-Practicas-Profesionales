from pydantic import BaseModel


class PadronEmpresarialResponse(BaseModel):
    id_empresa: int
    nombre_empresa: str
    rfc: str
    estado_empresa: str
    id_convenio: int | None = None
    estado_convenio: str | None = None
    id_vacante: int | None = None
    titulo: str | None = None
    estado_vacante: str | None = None
