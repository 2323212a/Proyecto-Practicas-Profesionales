from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import requerir_roles
from interfaces.api.schemas.rol import RolCreate, RolResponse, RolUpdate
from interfaces.api.service_factory import RolService
from infrastructure.persistence.models.usuario import UsuarioModel


router = APIRouter(
    prefix="/roles",
    tags=["Roles"],
    dependencies=[Depends(requerir_roles(["Administrador"]))]
)


@router.get("/", response_model=list[RolResponse])
def listar_roles(db: Session = Depends(obtener_db)):
    return RolService(db).listar()


@router.get("/{id_rol}", response_model=RolResponse)
def obtener_rol(id_rol: int, db: Session = Depends(obtener_db)):
    rol = RolService(db).obtener_por_id(id_rol)

    if rol is None:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    return rol


@router.post("/", response_model=RolResponse)
def crear_rol(
    rol: RolCreate,
    db: Session = Depends(obtener_db)
):
    return RolService(db).crear(rol)


@router.put("/{id_rol}", response_model=RolResponse)
def actualizar_rol(
    id_rol: int,
    datos: RolUpdate,
    db: Session = Depends(obtener_db)
):
    rol = RolService(db).actualizar(id_rol, datos)

    if rol is None:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    return rol


@router.delete("/{id_rol}")
def eliminar_rol(id_rol: int, db: Session = Depends(obtener_db)):
    usuarios_asociados = (
        db.query(UsuarioModel)
        .filter(UsuarioModel.id_rol == id_rol)
        .count()
    )
    if usuarios_asociados > 0:
        raise HTTPException(
            status_code=409,
            detail="No se puede eliminar este rol porque tiene usuarios asociados.",
        )

    rol = RolService(db).eliminar(id_rol)

    if rol is None:
        raise HTTPException(status_code=404, detail="Rol no encontrado")

    return {"mensaje": "Rol eliminado correctamente"}
