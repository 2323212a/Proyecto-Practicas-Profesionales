from datetime import datetime, timedelta, timezone
from jose import jwt

SECRET_KEY = "clave_secreta_practicas_profesionales"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 8


def crear_token(data: dict):
    datos = data.copy()

    expiracion = datetime.now(timezone.utc) + timedelta(
        minutes=ACCESS_TOKEN_EXPIRE_MINUTES
    )

    datos.update({"exp": expiracion})

    return jwt.encode(
        datos,
        SECRET_KEY,
        algorithm=ALGORITHM
    )