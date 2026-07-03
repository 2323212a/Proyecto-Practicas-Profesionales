from pydantic import BaseModel


class DocumentoCreate(BaseModel):
    id_expediente: int
    id_tipo_documento: int
    nombre_archivo: str
    ruta_archivo: str
    generado_por_sistema: bool = False

    model_config = {
        "json_schema_extra": {
            "example": {
                "id_expediente": 1,
                "id_tipo_documento": 1,
                "nombre_archivo": "carta_compromiso.pdf",
                "ruta_archivo": "/uploads/carta_compromiso.pdf",
                "generado_por_sistema": False
            }
        }
    }
