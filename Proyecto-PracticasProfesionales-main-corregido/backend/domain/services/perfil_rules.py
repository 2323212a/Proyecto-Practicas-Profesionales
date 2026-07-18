from __future__ import annotations
from domain.exceptions import BusinessRuleError


PERFILES_POR_ROL = {
    "alumno": "Alumno",
    "asesor interno": "PersonalInterno",
    "coordinador": "Coordinador",
    "coordinador de practicas": "Coordinador",
    "coordinador de prácticas": "Coordinador",
    "coordinador de unidades receptoras": "Coordinador",
    "unidad receptora": "Responsable Empresa",
    "responsable empresa": "Responsable Empresa",
    "responsable de empresa": "Responsable Empresa",
    "empresa": "Responsable Empresa",
}


def normalizar_rol(nombre: str | None):
    if not nombre:
        return None
    return " ".join(nombre.strip().lower().split())


def validar_rol_para_perfil(rol_nombre: str | None, perfil: str):
    perfil_esperado = PERFILES_POR_ROL.get(normalizar_rol(rol_nombre))
    if perfil_esperado != perfil:
        raise BusinessRuleError(f"El usuario no tiene rol compatible con perfil {perfil}")
