from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.configuracion_sistema import ConfiguracionSistemaModel
from infrastructure.persistence.models.usuario import UsuarioModel
from interfaces.api.schemas.auth import CambiarPasswordInicialRequest, LoginRequest, LoginResponse
from infrastructure.security.auth_dependencies import obtener_usuario_actual
from infrastructure.security.jwt import crear_token
from infrastructure.security.password import generar_password_hash, verificar_password


router = APIRouter(
    prefix="/auth",
    tags=["Auth"]
)


def obtener_estado_sistema(db: Session):
    configuracion = (
        db.query(ConfiguracionSistemaModel)
        .order_by(ConfiguracionSistemaModel.id_configuracion.asc())
        .first()
    )
    return configuracion.estado_sistema if configuracion is not None else "Activo"


def mensaje_bloqueo_sistema(estado: str):
    if estado == "Mantenimiento":
        return "El sistema esta en mantenimiento. Intenta mas tarde."
    if estado == "Suspendido":
        return "El sistema se encuentra suspendido temporalmente. Contacta a la administracion."
    return None


def _nombre_perfil(usuario: UsuarioModel):
    if usuario.alumno:
        return (
            usuario.alumno.nombre,
            usuario.alumno.apellido_paterno,
            usuario.alumno.apellido_materno,
            "Alumno",
            usuario.alumno.id_alumno,
        )
    if usuario.personal_interno:
        return (
            usuario.personal_interno.nombre,
            usuario.personal_interno.apellido_paterno,
            usuario.personal_interno.apellido_materno,
            "PersonalInterno",
            usuario.personal_interno.id_personal,
        )
    if usuario.responsable_empresa:
        return (
            usuario.responsable_empresa.nombre,
            usuario.responsable_empresa.apellido_paterno,
            usuario.responsable_empresa.apellido_materno,
            "ResponsableEmpresa",
            usuario.responsable_empresa.id_responsable,
        )
    return None, None, None, "SinPerfil", None


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
            "nombre": usuario.alumno.nombre,
            "apellido_paterno": usuario.alumno.apellido_paterno,
            "apellido_materno": usuario.alumno.apellido_materno,
            "semestre": usuario.alumno.semestre,
            "grupo": usuario.alumno.grupo,
            "creditos_aprobados": usuario.alumno.creditos_aprobados,
            "estado_alumno": usuario.alumno.estado_alumno,
        }

    if usuario.personal_interno:
        return "PersonalInterno", {
            "id_personal": usuario.personal_interno.id_personal,
            "nombre": usuario.personal_interno.nombre,
            "apellido_paterno": usuario.personal_interno.apellido_paterno,
            "apellido_materno": usuario.personal_interno.apellido_materno,
            "departamento": usuario.personal_interno.departamento,
            "cargo": usuario.personal_interno.cargo,
            "telefono": usuario.personal_interno.telefono,
        }

    if usuario.responsable_empresa:
        return "ResponsableEmpresa", {
            "id_responsable": usuario.responsable_empresa.id_responsable,
            "id_empresa": usuario.responsable_empresa.id_empresa,
            "nombre": usuario.responsable_empresa.nombre,
            "apellido_paterno": usuario.responsable_empresa.apellido_paterno,
            "apellido_materno": usuario.responsable_empresa.apellido_materno,
            "cargo": usuario.responsable_empresa.cargo,
            "telefono": usuario.responsable_empresa.telefono,
            "correo": usuario.responsable_empresa.correo,
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
    if rol_nombre != "Administrador":
        mensaje_bloqueo = mensaje_bloqueo_sistema(obtener_estado_sistema(db))
        if mensaje_bloqueo:
            raise HTTPException(status_code=403, detail=mensaje_bloqueo)

    perfil_tipo, perfil = obtener_perfil_usuario(usuario)
    nombre, apellido_paterno, apellido_materno, tipo_perfil, id_perfil = _nombre_perfil(usuario)
    nombre_completo = " ".join(parte for parte in [nombre, apellido_paterno, apellido_materno] if parte)

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
        "nombre": nombre or usuario.correo,
        "apellido_paterno": apellido_paterno,
        "apellido_materno": apellido_materno,
        "nombre_completo": nombre_completo,
        "correo": usuario.correo,
        "debe_cambiar_password": bool(usuario.debe_cambiar_password),
        "tipo_perfil": tipo_perfil,
        "id_perfil": id_perfil,
        "perfil_tipo": perfil_tipo,
        "perfil": perfil
    }


@router.post("/cambiar-password-inicial")
def cambiar_password_inicial(
    datos: CambiarPasswordInicialRequest,
    usuario: UsuarioModel = Depends(obtener_usuario_actual),
    db: Session = Depends(obtener_db),
):
    if usuario.id_rol != 1:
        raise HTTPException(status_code=403, detail="Solo alumnos pueden usar este cambio obligatorio")

    if not usuario.debe_cambiar_password:
        raise HTTPException(status_code=400, detail="El usuario no requiere cambio obligatorio de contrasena")

    if not verificar_password(datos.password_actual, usuario.password_hash):
        raise HTTPException(status_code=400, detail="La contrasena actual no es correcta")

    if datos.password_nueva != datos.confirmar_password:
        raise HTTPException(status_code=400, detail="La nueva contrasena no coincide")

    if len(datos.password_nueva) < 8:
        raise HTTPException(status_code=400, detail="La nueva contrasena debe tener al menos 8 caracteres")

    usuario.password_hash = generar_password_hash(datos.password_nueva)
    usuario.debe_cambiar_password = False
    usuario.fecha_cambio_password = datetime.utcnow()
    db.commit()

    return {"mensaje": "Contrasena actualizada correctamente"}


@router.get("/me")
def obtener_sesion_actual(usuario: UsuarioModel = Depends(obtener_usuario_actual)):
    perfil_tipo, perfil = obtener_perfil_usuario(usuario)
    nombre, apellido_paterno, apellido_materno, tipo_perfil, id_perfil = _nombre_perfil(usuario)
    nombre_completo = " ".join(parte for parte in [nombre, apellido_paterno, apellido_materno] if parte)
    return {
        "id_usuario": usuario.id_usuario,
        "id_rol": usuario.id_rol,
        "rol": usuario.rol.nombre if usuario.rol else None,
        "nombre": nombre or usuario.correo,
        "apellido_paterno": apellido_paterno,
        "apellido_materno": apellido_materno,
        "nombre_completo": nombre_completo,
        "correo": usuario.correo,
        "debe_cambiar_password": bool(usuario.debe_cambiar_password),
        "tipo_perfil": tipo_perfil,
        "id_perfil": id_perfil,
        "perfil_tipo": perfil_tipo,
        "perfil": perfil,
    }
