from typing import Optional

from sqlalchemy.orm import Session

from infrastructure.persistence.models.notificacion import NotificacionModel
from infrastructure.persistence.models.rol import RolModel
from infrastructure.persistence.models.usuario import UsuarioModel


def crear_notificacion(db: Session, id_usuario: Optional[int], titulo: str, mensaje: str) -> None:
    if not id_usuario:
        return
    db.add(
        NotificacionModel(
            id_usuario=id_usuario,
            titulo=titulo[:150],
            mensaje=mensaje,
            leida=False,
        )
    )


def notificar_roles(db: Session, roles: list[str], titulo: str, mensaje: str) -> None:
    usuarios = (
        db.query(UsuarioModel)
        .join(RolModel, RolModel.id_rol == UsuarioModel.id_rol)
        .filter(
            UsuarioModel.estado == "Activo",
            RolModel.nombre.in_(roles),
        )
        .all()
    )
    for usuario in usuarios:
        crear_notificacion(db, usuario.id_usuario, titulo, mensaje)
