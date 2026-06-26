from fastapi import APIRouter, Depends,  HTTPException
from sqlalchemy.orm import Session
from schemas.usuario import UsuarioCreate, UsuarioResponse, UsuarioUpdate
from database.dependencies import obtener_db
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

@router.patch("/{id_usuario}/estado", response_model=UsuarioResponse)
def cambiar_estado_usuario(
    id_usuario: int,
    db: Session = Depends(obtener_db)
):
    usuario = UsuarioService(db).cambiar_estado(id_usuario)

    if usuario is None:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    return usuario

@router.delete("/{id_usuario}")
def eliminar_usuario(
    id_usuario: int,
    db: Session = Depends(obtener_db)
):
    usuario = UsuarioService(db).eliminar(id_usuario)

    if usuario is None:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado"
        )

    return {"mensaje": "Usuario eliminado correctamente"}

@router.put("/{id_usuario}", response_model=UsuarioResponse)
def actualizar_usuario(
    id_usuario: int,
    datos: UsuarioUpdate,
    db: Session = Depends(obtener_db)
):
    usuario = UsuarioService(db).actualizar(id_usuario, datos)

    if usuario is None:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return usuario