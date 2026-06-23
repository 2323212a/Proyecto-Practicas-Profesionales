from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from schemas.rol import RolCreate, RolResponse
from services.rol_service import RolService


router = APIRouter(
    prefix="/roles",
    tags=["Roles"]
)


@router.get("/", response_model=list[RolResponse])
def listar_roles(db: Session = Depends(obtener_db)):
    return RolService(db).listar()


@router.post("/", response_model=RolResponse)
def crear_rol(
    rol: RolCreate,
    db: Session = Depends(obtener_db)
):
    return RolService(db).crear(rol)