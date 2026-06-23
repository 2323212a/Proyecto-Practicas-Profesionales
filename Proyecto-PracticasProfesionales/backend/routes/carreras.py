from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.dependencies import obtener_db

from schemas.carrera import (
    CarreraCreate,
    CarreraResponse
)

from services.carrera_service import CarreraService


router = APIRouter(
    prefix="/carreras",
    tags=["Carreras"]
)


@router.get(
    "/",
    response_model=list[CarreraResponse]
)
def listar_carreras(
    db: Session = Depends(obtener_db)
):
    return CarreraService(db).listar()


@router.post(
    "/",
    response_model=CarreraResponse
)
def crear_carrera(
    carrera: CarreraCreate,
    db: Session = Depends(obtener_db)
):
    return CarreraService(db).crear(carrera)