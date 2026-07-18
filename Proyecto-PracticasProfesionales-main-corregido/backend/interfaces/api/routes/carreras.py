from app.services.auditoria_service import registrar_bitacora
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.security.auth_dependencies import obtener_usuario_actual
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
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    nueva_carrera = CarreraService(db).crear(carrera)
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Crear carrera",
        "carreras",
        f"Admin creo la carrera {nueva_carrera.nombre}",
        "carrera",
        nueva_carrera.id_carrera,
    )
    return nueva_carrera


@router.put(
    "/{id_carrera}",
    response_model=CarreraResponse,
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)
def actualizar_carrera(
    id_carrera: int,
    carrera: CarreraUpdate,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    carrera_actualizada = CarreraService(db).actualizar(id_carrera, carrera)
    if carrera_actualizada is None:
        raise HTTPException(status_code=404, detail="Carrera no encontrada")
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Editar carrera",
        "carreras",
        f"Admin edito la carrera {carrera_actualizada.nombre}",
        "carrera",
        carrera_actualizada.id_carrera,
    )
    return carrera_actualizada


@router.delete(
    "/{id_carrera}",
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)
def eliminar_carrera(
    id_carrera: int,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    carrera = CarreraService(db).obtener_por_id(id_carrera)
    if carrera is None:
        raise HTTPException(status_code=404, detail="Carrera no encontrada")
    carrera.estado = "Inactiva"
    db.commit()
    db.refresh(carrera)
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Desactivar carrera",
        "carreras",
        f"Admin desactivo la carrera {carrera.nombre}",
        "carrera",
        id_carrera,
    )
    return {"mensaje": "Carrera desactivada correctamente"}
