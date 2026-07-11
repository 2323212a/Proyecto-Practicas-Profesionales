from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.security.jwt import decodificar_token

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def obtener_usuario_actual(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(obtener_db),
) -> UsuarioModel:
    payload = decodificar_token(token)
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token invalido o expirado",
            headers={"WWW-Authenticate": "Bearer"},
        )

    id_usuario = payload.get("sub")
    if id_usuario is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token sin usuario",
            headers={"WWW-Authenticate": "Bearer"},
        )

    try:
        id_usuario_int = int(id_usuario)
    except (TypeError, ValueError):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token con usuario invalido",
            headers={"WWW-Authenticate": "Bearer"},
        )

    usuario = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == id_usuario_int).first()
    if usuario is None or usuario.estado != "Activo":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no autorizado",
            headers={"WWW-Authenticate": "Bearer"},
        )
    return usuario


def usuario_tiene_rol(usuario: UsuarioModel, roles: set[str]) -> bool:
    return usuario.rol is not None and usuario.rol.nombre in roles


def requerir_roles(roles: list[str]):
    roles_permitidos = set(roles)

    def dependency(usuario: UsuarioModel = Depends(obtener_usuario_actual)) -> UsuarioModel:
        if not usuario_tiene_rol(usuario, roles_permitidos):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta accion",
            )
        return usuario

    return dependency


def es_admin(usuario: UsuarioModel) -> bool:
    return usuario_tiene_rol(usuario, {"Administrador"})


def es_admin_o_direccion(usuario: UsuarioModel) -> bool:
    return usuario_tiene_rol(usuario, {"Administrador", "Direccion"})


def requerir_alumno_actual_o_roles(roles_extra: list[str]):
    roles_permitidos = set(roles_extra)

    def dependency(
        id_alumno: int = None,
        usuario: UsuarioModel = Depends(obtener_usuario_actual),
    ) -> UsuarioModel:
        if usuario_tiene_rol(usuario, roles_permitidos):
            return usuario
        if id_alumno is None and usuario.alumno:
            return usuario
        if usuario.alumno and usuario.alumno.id_alumno == id_alumno:
            return usuario
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes acceder a informacion de otro alumno",
        )

    return dependency


def requerir_docente_actual_o_roles(roles_extra: list[str]):
    roles_permitidos = set(roles_extra)

    def dependency(
        id_docente: int = None,
        usuario: UsuarioModel = Depends(obtener_usuario_actual),
    ) -> UsuarioModel:
        if usuario_tiene_rol(usuario, roles_permitidos):
            return usuario
        if id_docente is None and usuario.docente:
            return usuario
        if usuario.docente and usuario.docente.id_docente == id_docente:
            return usuario
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes acceder a informacion de otro docente",
        )

    return dependency


def requerir_empresa_actual_o_roles(roles_extra: list[str]):
    roles_permitidos = set(roles_extra)

    def dependency(
        id_empresa: int = None,
        usuario: UsuarioModel = Depends(obtener_usuario_actual),
    ) -> UsuarioModel:
        if usuario_tiene_rol(usuario, roles_permitidos):
            return usuario
        if id_empresa is None and usuario.responsable_empresa:
            return usuario
        if usuario.responsable_empresa and usuario.responsable_empresa.id_empresa == id_empresa:
            return usuario
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes acceder a informacion de otra empresa",
        )

    return dependency


def obtener_id_alumno_actual(usuario: UsuarioModel = Depends(obtener_usuario_actual)) -> int:
    if usuario.alumno is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario actual no tiene perfil de alumno",
        )
    return usuario.alumno.id_alumno


def obtener_id_docente_actual(usuario: UsuarioModel = Depends(obtener_usuario_actual)) -> int:
    if usuario.docente is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario actual no tiene perfil de docente",
        )
    return usuario.docente.id_docente


def obtener_id_empresa_actual(usuario: UsuarioModel = Depends(obtener_usuario_actual)) -> int:
    if usuario.responsable_empresa is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El usuario actual no tiene empresa asociada",
        )
    return usuario.responsable_empresa.id_empresa
