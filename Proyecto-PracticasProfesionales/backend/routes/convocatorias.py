from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

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