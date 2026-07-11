from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.usuario import UsuarioModel
from interfaces.api.schemas.auth import LoginRequest, LoginResponse
from infrastructure.security.auth_dependencies import obtener_usuario_actual
from infrastructure.security.jwt import crear_token
from infrastructure.security.password import verificar_password


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


def obtener_perfil_usuario(usuario: UsuarioModel):
    if usuario.alumno:
        return "Alumno", {
            "id_alumno": usuario.alumno.id_alumno,
            "id_carrera": usuario.alumno.id_carrera,
            "carrera": (
                usuario.alumno.carrera.nombre
                if usuario.alumno.carrera
                else None
            ),
            "matricula": usuario.alumno.matricula,
            "semestre": usuario.alumno.semestre,
            "grupo": usuario.alumno.grupo,
            "estado_alumno": usuario.alumno.estado_alumno,
        }

    if usuario.docente:
        return "Docente", {
            "id_docente": usuario.docente.id_docente,
            "departamento": usuario.docente.departamento,
        }

    if usuario.coordinador:
        return "Coordinador", {
            "id_coordinador": usuario.coordinador.id_coordinador,
            "area": usuario.coordinador.area,
            "departamento": usuario.coordinador.departamento,
        }

    if usuario.responsable_empresa:
        return "Responsable Empresa", {
            "id_responsable": usuario.responsable_empresa.id_responsable,
            "id_empresa": usuario.responsable_empresa.id_empresa,
            "cargo": usuario.responsable_empresa.cargo,
            "telefono": usuario.responsable_empresa.telefono,
        }

    return None, None


@router.post("/login", response_model=LoginResponse)
def login(
    credenciales: LoginRequest,
    db: Session = Depends(obtener_db)
):
    usuario = (
        db.query(UsuarioModel)
        .filter(UsuarioModel.correo == credenciales.correo)
        .first()
    )

    if usuario is None:
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos"
        )

    if usuario.estado != "Activo":
        raise HTTPException(
            status_code=401,
            detail="Usuario inactivo. Contacta al administrador."
        )

    if not verificar_password(
        credenciales.password,
        usuario.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos"
        )

    rol_nombre = usuario.rol.nombre if usuario.rol else None
    perfil_tipo, perfil = obtener_perfil_usuario(usuario)
    nombre_completo = " ".join(
        parte for parte in [
            usuario.nombre,
            usuario.apellido_paterno,
            usuario.apellido_materno,
        ]
        if parte
    )

    token = crear_token({
        "sub": str(usuario.id_usuario),
        "id_rol": usuario.id_rol,
        "rol": rol_nombre,
        "correo": usuario.correo
    })

    return {
        "access_token": token,
        "token_type": "bearer",
        "id_usuario": usuario.id_usuario,
        "id_rol": usuario.id_rol,
        "rol": rol_nombre,
        "nombre": usuario.nombre,
        "apellido_paterno": usuario.apellido_paterno,
        "apellido_materno": usuario.apellido_materno,
        "nombre_completo": nombre_completo,
        "correo": usuario.correo,
        "perfil_tipo": perfil_tipo,
        "perfil": perfil
    }


@router.get("/me")
def obtener_sesion_actual(usuario: UsuarioModel = Depends(obtener_usuario_actual)):
    perfil_tipo, perfil = obtener_perfil_usuario(usuario)
    nombre_completo = " ".join(
        parte for parte in [
            usuario.nombre,
            usuario.apellido_paterno,
            usuario.apellido_materno,
        ]
        if parte
    )
    return {
        "id_usuario": usuario.id_usuario,
        "id_rol": usuario.id_rol,
        "rol": usuario.rol.nombre if usuario.rol else None,
        "nombre": usuario.nombre,
        "apellido_paterno": usuario.apellido_paterno,
        "apellido_materno": usuario.apellido_materno,
        "nombre_completo": nombre_completo,
        "correo": usuario.correo,
        "perfil_tipo": perfil_tipo,
        "perfil": perfil,
    }
