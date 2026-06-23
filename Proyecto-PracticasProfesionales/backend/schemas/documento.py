from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DocumentoCreate(BaseModel):
    id_expediente: int
    id_tipo_documento: int
    nombre_archivo: str
    ruta_archivo: str
    generado_por_sistema: bool = False


class DocumentoResponse(BaseModel):
    id_documento: int
    id_expediente: int
    id_tipo_documento: int
    nombre_archivo: str
    ruta_archivo: str
    estado_documento: str
    fecha_carga: datetime
    generado_por_sistema: bool

    model_config = ConfigDict(from_attributes=True)