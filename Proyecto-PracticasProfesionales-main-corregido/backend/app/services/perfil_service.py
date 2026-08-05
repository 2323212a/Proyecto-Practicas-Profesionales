from fastapi import HTTPException

from domain.exceptions import BusinessRuleError
from domain.ports.repositories import PerfilRepositoryPort
from domain.services.perfil_rules import validar_rol_para_perfil


class PerfilService:
    def __init__(self, repository: PerfilRepositoryPort):
        self.repository = repository

    def obtener_usuario(self, id_usuario: int):
        usuario = self.repository.obtener_usuario(id_usuario)
        if usuario is None:
            raise HTTPException(status_code=404, detail="Usuario no encontrado")
        return usuario

    def validar_usuario_para_perfil(self, id_usuario: int, perfil: str):
        usuario = self.obtener_usuario(id_usuario)
        try:
            validar_rol_para_perfil(usuario.rol.nombre if usuario.rol else None, perfil)
        except BusinessRuleError as exc:
            raise HTTPException(status_code=400, detail=exc.message) from exc

        if self.usuario_tiene_perfil(id_usuario):
            raise HTTPException(
                status_code=400,
                detail="El usuario ya tiene un perfil asignado"
            )

        return usuario

    def usuario_tiene_perfil(self, id_usuario: int):
        return self.repository.usuario_tiene_perfil(id_usuario)
