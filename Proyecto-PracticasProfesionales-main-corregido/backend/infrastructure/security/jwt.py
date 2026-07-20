from __future__ import annotations

from datetime import datetime, timedelta, timezone
import os

from jose import JWTError, jwt

SECRET_KEY = os.getenv("JWT_SECRET_KEY")
if not SECRET_KEY:
    raise RuntimeError(
        "JWT_SECRET_KEY no esta configurada. Copia .env.example a .env y define una clave segura."
    )
if len(SECRET_KEY) < 32 or SECRET_KEY.startswith("reemplaza-por-una-clave"):
    raise RuntimeError("JWT_SECRET_KEY debe tener al menos 32 caracteres y no puede ser el valor de ejemplo.")

ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8


def crear_token(data: dict):
    datos = data.copy()
    expiracion = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    datos.update({"exp": expiracion})
    return jwt.encode(datos, SECRET_KEY, algorithm=ALGORITHM)


def decodificar_token(token: str):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None
