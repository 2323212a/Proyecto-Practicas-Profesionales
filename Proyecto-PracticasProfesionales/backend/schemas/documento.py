from datetime import datetime
from pydantic import BaseModel, ConfigDict


class DocumentoCreate(BaseModel):
    id_expediente: int
    id_tipo_documento: int

    nombre_archivo: str | None = None
    ruta_archivo: str | None = None

    generado_por_sistema: bool = False
    requiere_validacion_automatica: bool = False


class DocumentoResponse(BaseModel):
    id_documento: int

    id_expediente: int
    id_tipo_documento: int

    nombre_archivo: str | None = None
    ruta_archivo: str | None = None

    estado_documento: str
    fecha_carga: datetime

    generado_por_sistema: bool
    requiere_validacion_automatica: bool

    validacion_automatica_estado: str
    fecha_validacion_automatica: datetime | None = None

    model_config = ConfigDict(from_attributes=True)