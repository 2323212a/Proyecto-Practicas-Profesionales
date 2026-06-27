from pydantic import BaseModel, ConfigDict


class TipoDocumentoCreate(BaseModel):
    nombre_documento: str
    descripcion: str | None = None
    etapa: str | None = None
    obligatorio: bool = True


class TipoDocumentoResponse(BaseModel):
    id_tipo_documento: int
    nombre_documento: str | None = None
    descripcion: str | None = None
    etapa: str | None = None
    obligatorio: bool

    model_config = ConfigDict(from_attributes=True)

class TipoDocumentoUpdate(BaseModel):
    nombre_documento: str
    descripcion: str | None = None
    etapa: str | None = None
    obligatorio: bool = True