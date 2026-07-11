from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto"
)


def verificar_password(password_plano: str, password_hash: str):
    return pwd_context.verify(password_plano, password_hash)


def generar_password_hash(password: str):
    return pwd_context.hash(password)