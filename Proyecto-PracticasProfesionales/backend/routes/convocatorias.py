from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from schemas.convocatoria import ConvocatoriaCreate, ConvocatoriaResponse, ConvocatoriaUpdate
from database.dependencies import obtener_db

from schemas.convocatoria import (
    ConvocatoriaCreate,
    ConvocatoriaResponse
)

from services.convocatoria_service import (
    ConvocatoriaService
)


router = APIRouter(
    prefix="/convocatorias",
    tags=["Convocatorias"]
)


@router.get(
    "/",
    response_model=list[ConvocatoriaResponse]
)
def listar_convocatorias(
    db: Session = Depends(obtener_db)
):
    return ConvocatoriaService(db).listar()


@router.post(
    "/",
    response_model=ConvocatoriaResponse
)
def crear_convocatoria(
    convocatoria: ConvocatoriaCreate,
    db: Session = Depends(obtener_db)
):
    return ConvocatoriaService(db).crear(convocatoria)

@router.put("/{id_convocatoria}", response_model=ConvocatoriaResponse)
def actualizar_convocatoria(
    id_convocatoria: int,
    convocatoria: ConvocatoriaUpdate,
    db: Session = Depends(obtener_db)
):
    convocatoria_actualizada = ConvocatoriaService(db).actualizar(
        id_convocatoria,
        convocatoria
    )

    if convocatoria_actualizada is None:
        raise HTTPException(
            status_code=404,
            detail="Convocatoria no encontrada"
        )

    return convocatoria_actualizada


@router.delete("/{id_convocatoria}")
def eliminar_convocatoria(
    id_convocatoria: int,
    db: Session = Depends(obtener_db)
):
    convocatoria = ConvocatoriaService(db).eliminar(id_convocatoria)

    if convocatoria is None:
        raise HTTPException(
            status_code=404,
            detail="Convocatoria no encontrada"
        )

    return {"mensaje": "Convocatoria eliminada correctamente"}