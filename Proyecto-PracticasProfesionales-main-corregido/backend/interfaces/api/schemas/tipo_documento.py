from __future__ import annotations
from pydantic import BaseModel, ConfigDict


class TipoDocumentoCreate(BaseModel):
    nombre_documento: str
    descripcion: str | None = None
    etapa: str
    obligatorio: bool = True
    requiere_formato: bool = False


class TipoDocumentoResponse(BaseModel):
    id_tipo_documento: int
    nombre_documento: str
    descripcion: str | None = None
    etapa: str
    obligatorio: bool
    requiere_formato: bool

    model_config = ConfigDict(from_attributes=True)

class TipoDocumentoUpdate(BaseModel):
    nombre_documento: str
    descripcion: str | None = None
    etapa: str
    obligatorio: bool = True
    requiere_formato: bool = False
