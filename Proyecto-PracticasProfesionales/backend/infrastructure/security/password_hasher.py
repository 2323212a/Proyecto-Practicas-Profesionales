from domain.ports.security import PasswordHasherPort
from infrastructure.security.password import generar_password_hash, verificar_password


class PasslibPasswordHasher(PasswordHasherPort):
    def hash(self, password: str) -> str:
        return generar_password_hash(password)

    def verify(self, password: str, password_hash: str) -> bool:
        return verificar_password(password, password_hash)
