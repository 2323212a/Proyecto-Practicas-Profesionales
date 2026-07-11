from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import requerir_roles
from interfaces.api.schemas.carrera import CarreraCreate, CarreraResponse, CarreraUpdate
from interfaces.api.service_factory import CarreraService


router = APIRouter(
    prefix="/carreras",
    tags=["Carreras"],
)

ROLES_LECTURA_CARRERAS = [
    "Administrador",
    "Coordinador de Practicas",
    "Coordinador de Unidades Receptoras",
    "Unidad Receptora",
    "Direccion",
]


@router.get(
    "/",
    response_model=list[CarreraResponse],
    dependencies=[Depends(requerir_roles(ROLES_LECTURA_CARRERAS))],
)
def listar_carreras(db: Session = Depends(obtener_db)):
    return CarreraService(db).listar()


@router.get(
    "/{id_carrera}",
    response_model=CarreraResponse,
    dependencies=[Depends(requerir_roles(ROLES_LECTURA_CARRERAS))],
)
def obtener_carrera(
    id_carrera: int,
    db: Session = Depends(obtener_db),
):
    carrera = CarreraService(db).obtener_por_id(id_carrera)
    if carrera is None:
        raise HTTPException(status_code=404, detail="Carrera no encontrada")
    return carrera


@router.post(
    "/",
    response_model=CarreraResponse,
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)
def crear_carrera(
    carrera: CarreraCreate,
    db: Session = Depends(obtener_db),
):
    return CarreraService(db).crear(carrera)


@router.put(
    "/{id_carrera}",
    response_model=CarreraResponse,
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)
def actualizar_carrera(
    id_carrera: int,
    carrera: CarreraUpdate,
    db: Session = Depends(obtener_db),
):
    carrera_actualizada = CarreraService(db).actualizar(id_carrera, carrera)
    if carrera_actualizada is None:
        raise HTTPException(status_code=404, detail="Carrera no encontrada")
    return carrera_actualizada


@router.delete(
    "/{id_carrera}",
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)
def eliminar_carrera(
    id_carrera: int,
    db: Session = Depends(obtener_db),
):
    carrera = CarreraService(db).eliminar(id_carrera)
    if carrera is None:
        raise HTTPException(status_code=404, detail="Carrera no encontrada")
    return {"mensaje": "Carrera eliminada correctamente"}
