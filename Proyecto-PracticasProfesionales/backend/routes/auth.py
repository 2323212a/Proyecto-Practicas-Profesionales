from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from models.usuario import UsuarioModel
from security.password import verificar_password
from security.jwt import crear_token
from schemas.auth import LoginRequest, LoginResponse


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


@router.post("/login", response_model=LoginResponse)
def login(
    credenciales: LoginRequest,
    db: Session = Depends(obtener_db)
):
    usuario = (
        db.query(UsuarioModel)
        .filter(UsuarioModel.correo == credenciales.correo)
        .first()
    )

    if usuario is None:
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos"
        )

    if not verificar_password(
        credenciales.password,
        usuario.password
    ):
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos"
        )

    token = crear_token({
        "sub": str(usuario.id_usuario),
        "id_rol": usuario.id_rol,
        "correo": usuario.correo
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "id_usuario": usuario.id_usuario,
        "id_rol": usuario.id_rol,
        "nombre": usuario.nombre,
        "correo": usuario.correo
    }