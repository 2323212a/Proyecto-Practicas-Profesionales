from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from schemas.tipo_documento import TipoDocumentoCreate, TipoDocumentoResponse
from services.tipo_documento_service import TipoDocumentoService


router = APIRouter(
    prefix="/tipos-documento",
    tags=["Tipos de Documento"]
)


@router.get("/", response_model=list[TipoDocumentoResponse])
def listar_tipos_documento(db: Session = Depends(obtener_db)):
    return TipoDocumentoService(db).listar()


@router.post("/", response_model=TipoDocumentoResponse)
def crear_tipo_documento(
    tipo_documento: TipoDocumentoCreate,
    db: Session = Depends(obtener_db)
):
    return TipoDocumentoService(db).crear(tipo_documento)