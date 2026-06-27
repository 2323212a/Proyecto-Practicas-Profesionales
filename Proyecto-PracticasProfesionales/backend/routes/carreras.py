from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import APIRouter, Depends, HTTPException
from schemas.carrera import CarreraCreate, CarreraResponse, CarreraUpdate
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

@router.put("/{id_carrera}", response_model=CarreraResponse)
def actualizar_carrera(
    id_carrera: int,
    carrera: CarreraUpdate,
    db: Session = Depends(obtener_db)
):
    carrera_actualizada = CarreraService(db).actualizar(
        id_carrera,
        carrera
    )

    if carrera_actualizada is None:
        raise HTTPException(
            status_code=404,
            detail="Carrera no encontrada"
        )

    return carrera_actualizada


@router.delete("/{id_carrera}")
def eliminar_carrera(
    id_carrera: int,
    db: Session = Depends(obtener_db)
):
    carrera = CarreraService(db).eliminar(id_carrera)

    if carrera is None:
        raise HTTPException(
            status_code=404,
            detail="Carrera no encontrada"
        )

    return {"mensaje": "Carrera eliminada correctamente"}

