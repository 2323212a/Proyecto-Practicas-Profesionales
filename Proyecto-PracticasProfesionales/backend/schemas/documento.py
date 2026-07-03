from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DocumentoCreate(BaseModel):
    id_expediente: int
    id_tipo_documento: int
    nombre_archivo: str | None = None
    ruta_archivo: str | None = None
    generado_por_sistema: bool = False


class DocumentoResponse(BaseModel):
    id_documento: int
    id_expediente: int
    id_tipo_documento: int
    nombre_archivo: str | None = None
    ruta_archivo: str | None = None
    estado_documento: str
    fecha_carga: datetime | None = None
    generado_por_sistema: bool | None = False

    model_config = ConfigDict(from_attributes=True)