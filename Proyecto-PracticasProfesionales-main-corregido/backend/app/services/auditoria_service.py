from __future__ import annotations

from typing import Optional

from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from infrastructure.persistence.models.bitacora_auditoria import BitacoraAuditoriaModel


CLAVES_SENSIBLES = {
    "password",
    "password_hash",
    "contrasena",
    "contraseña",
    "token",
    "refresh_token",
    "smtp_password",
    "password_temporal",
    "secret",
}


def _contiene_dato_sensible(*valores: object) -> bool:
    texto = " ".join(str(valor or "") for valor in valores).lower()
    return any(clave in texto for clave in CLAVES_SENSIBLES)


def registrar_bitacora(
    db: Session,
    id_usuario: Optional[int],
    accion: str,
    modulo: str,
    descripcion: str,
    entidad: Optional[str] = None,
    id_entidad: Optional[int] = None,
    ip: Optional[str] = None,
    user_agent: Optional[str] = None,
):
    if _contiene_dato_sensible(accion, modulo, descripcion, entidad, ip, user_agent):
        return None

    try:
        registro = BitacoraAuditoriaModel(
            id_usuario=id_usuario,
            accion=accion,
            modulo=modulo,
            descripcion=descripcion,
            entidad=entidad,
            id_entidad=id_entidad,
            ip=ip,
            user_agent=user_agent,
        )
        db.add(registro)
        db.commit()
        db.refresh(registro)
        return registro
    except SQLAlchemyError:
        db.rollback()
        return None
