from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from database.dependencies import obtener_db
from schemas.tipo_documento import TipoDocumentoCreate, TipoDocumentoResponse
from services.tipo_documento_service import TipoDocumentoService

from schemas.tipo_documento import (
    TipoDocumentoCreate,
    TipoDocumentoResponse,
    TipoDocumentoUpdate
)

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

@router.put(
    "/{id_tipo_documento}",
    response_model=TipoDocumentoResponse
)
def actualizar_tipo_documento(
    id_tipo_documento: int,
    tipo_documento: TipoDocumentoUpdate,
    db: Session = Depends(obtener_db)
):
    tipo = TipoDocumentoService(db).actualizar(
        id_tipo_documento,
        tipo_documento
    )

    if tipo is None:
        raise HTTPException(
            status_code=404,
            detail="Tipo de documento no encontrado"
        )

    return tipo


@router.delete("/{id_tipo_documento}")
def eliminar_tipo_documento(
    id_tipo_documento: int,
    db: Session = Depends(obtener_db)
):
    tipo = TipoDocumentoService(db).eliminar(
        id_tipo_documento
    )

    if tipo is None:
        raise HTTPException(
            status_code=404,
            detail="Tipo de documento no encontrado"
        )

    return {
        "mensaje":
        "Tipo de documento eliminado correctamente"
    }