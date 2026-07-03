from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.dependencies import obtener_db

from schemas.usuario import (
    UsuarioCreate,
    UsuarioResponse
)

from services.usuario_service import UsuarioService


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"]
)


@router.get(
    "/",
    response_model=list[UsuarioResponse]
)
def listar_usuarios(
    db: Session = Depends(obtener_db)
):
    return UsuarioService(db).listar()


@router.post(
    "/",
    response_model=UsuarioResponse
)
def crear_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(obtener_db)
):
    return UsuarioService(db).crear(usuario)