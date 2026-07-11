from __future__ import annotations
from fastapi import HTTPException

from app.services.perfil_service import PerfilService
from domain.ports.repositories import UsuarioRepositoryPort
from domain.ports.security import PasswordHasherPort


class UsuarioService:
    def __init__(
        self,
        repository: UsuarioRepositoryPort,
        perfil_service: PerfilService,
        password_hasher: PasswordHasherPort
    ):
        self.repository = repository
        self.perfil_service = perfil_service
        self.password_hasher = password_hasher

    def listar(self):
        return self.repository.listar()

    def obtener_por_id(self, id_usuario: int):
        return self.repository.obtener_por_id(id_usuario)

    def crear(self, usuario):
        self._validar_rol(usuario.id_rol)
        self._validar_correo_disponible(usuario.correo)

        nuevo_usuario = self.repository.nuevo({
            "id_rol": usuario.id_rol,
            "nombre": usuario.nombre,
            "apellido_paterno": usuario.apellido_paterno,
            "apellido_materno": usuario.apellido_materno,
            "correo": usuario.correo,
            "password_hash": self.password_hasher.hash(usuario.password),
            "estado": "Activo"
        })

        return self.repository.crear(nuevo_usuario)

    def cambiar_estado(self, id_usuario: int):
        usuario = self.obtener_por_id(id_usuario)
        if usuario is None:
            return None

        usuario.estado = "Inactivo" if usuario.estado == "Activo" else "Activo"
        return self.repository.commit_refresh(usuario)

    def eliminar(self, id_usuario: int):
        usuario = self.obtener_por_id(id_usuario)
        if usuario is None:
            return None

        return self.repository.eliminar(usuario)

    def actualizar(self, id_usuario: int, datos):
        usuario = self.obtener_por_id(id_usuario)
        if usuario is None:
            return None

        self._validar_rol(datos.id_rol)
        self._validar_correo_disponible(datos.correo, id_usuario)

        if usuario.id_rol != datos.id_rol and self.perfil_service.usuario_tiene_perfil(id_usuario):
            raise HTTPException(
                status_code=400,
                detail="No se puede cambiar el rol de un usuario que ya tiene perfil"
            )

        usuario.id_rol = datos.id_rol
        usuario.nombre = datos.nombre
        usuario.apellido_paterno = datos.apellido_paterno
        usuario.apellido_materno = datos.apellido_materno
        usuario.correo = datos.correo
        usuario.estado = datos.estado

        return self.repository.commit_refresh(usuario)

    def _validar_rol(self, id_rol: int):
        rol = self.repository.obtener_rol(id_rol)
        if rol is None:
            raise HTTPException(status_code=404, detail="Rol no encontrado")

    def _validar_correo_disponible(self, correo: str, id_usuario_actual: int | None = None):
        usuario = self.repository.obtener_por_correo(correo)
        if usuario and usuario.id_usuario != id_usuario_actual:
            raise HTTPException(status_code=400, detail="El correo ya está registrado")
