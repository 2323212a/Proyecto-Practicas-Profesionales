from datetime import date

from pydantic import BaseModel


class ConvenioCreate(BaseModel):
    id_empresa: int
    fecha_inicio: date
    fecha_fin: date
    documento_convenio: str
    tipo_convenio: str
    observaciones: str
