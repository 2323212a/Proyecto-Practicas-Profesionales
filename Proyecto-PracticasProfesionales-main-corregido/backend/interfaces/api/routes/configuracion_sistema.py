from __future__ import annotations

from datetime import date
import re

from app.services.auditoria_service import registrar_bitacora
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.configuracion_sistema import ConfiguracionSistemaModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.security.auth_dependencies import obtener_usuario_actual
from infrastructure.security.auth_dependencies import requerir_roles
from interfaces.api.schemas.configuracion_sistema import (
    ConfiguracionSistemaResponse,
    ConfiguracionSistemaUpdate,
)


router = APIRouter(
    prefix="/configuracion-sistema",
    tags=["Configuracion Sistema"],
)


VALORES_DEFAULT = {
    "nombre_sistema": "Sistema Integral de Practicas Profesionales",
    "escuela_facultad": "ETDA C-I",
    "correo_institucional": "practicas@unach.mx",
    "secretaria_academica": "Paola Lopez",
    "coordinadora_practicas": "Guadalupe Velazquez",
    "estado_sistema": "Activo",
    "inscripcion_empresas_estado": "Abierta",
    "ciclo_escolar": "Ciclo Escolar 2026-2027",
    "hero_titulo": "Sistema Integral de Practicas Profesionales",
    "hero_subtitulo": (
        "Plataforma institucional para la gestion, seguimiento y control "
        "de las practicas profesionales."
    ),
    "soporte_telefono": "(961) 619-1200",
}

ESTADOS_SISTEMA = {"Activo", "Mantenimiento", "Suspendido"}
TELEFONO_PATTERN = re.compile(r"^[0-9+\-()\s]{7,30}$")


def limpiar_texto(valor: str | None):
    if valor is None:
        return None
    texto = valor.strip()
    return texto or None


def validar_texto_requerido(valor: str | None, campo: str):
    texto = limpiar_texto(valor)
    if not texto:
        raise HTTPException(status_code=400, detail=f"{campo} es obligatorio")
    return texto


def validar_telefono(valor: str | None):
    telefono = limpiar_texto(valor)
    if telefono is None:
        return None
    if not TELEFONO_PATTERN.match(telefono):
        raise HTTPException(status_code=400, detail="Telefono de soporte con formato no valido")
    return telefono


def obtener_convocatoria_principal(db: Session, id_convocatoria: int | None = None):
    if id_convocatoria is not None:
        convocatoria = (
            db.query(ConvocatoriaModel)
            .filter(ConvocatoriaModel.id_convocatoria == id_convocatoria)
            .first()
        )
        if convocatoria is not None:
            return convocatoria

    return (
        db.query(ConvocatoriaModel)
        .filter(ConvocatoriaModel.estado == "Activa")
        .order_by(ConvocatoriaModel.fecha_inicio_general.desc(), ConvocatoriaModel.id_convocatoria.desc())
        .first()
        or db.query(ConvocatoriaModel)
        .order_by(ConvocatoriaModel.fecha_inicio_general.desc(), ConvocatoriaModel.id_convocatoria.desc())
        .first()
    )


def calcular_estado_inscripcion_empresas(convocatoria: ConvocatoriaModel | None):
    if convocatoria is None:
        return "Cerrada", "No hay convocatoria configurada."
    if convocatoria.estado != "Activa":
        return "Cerrada", "La convocatoria no esta activa."
    if not convocatoria.fecha_inicio_empresas or not convocatoria.fecha_cierre_empresas:
        return "Cerrada", "La convocatoria no tiene fechas de registro de empresas."

    hoy = date.today()
    if convocatoria.fecha_inicio_general <= hoy <= convocatoria.fecha_cierre_general:
        return "Abierta", "Dentro del periodo de registro de empresas de la convocatoria."
    return "Cerrada", "Fuera del periodo de registro de empresas de la convocatoria."


def obtener_o_crear_configuracion(db: Session):
    configuracion = (
        db.query(ConfiguracionSistemaModel)
        .order_by(ConfiguracionSistemaModel.id_configuracion.asc())
        .first()
    )
    if configuracion is not None:
        return configuracion

    configuracion = ConfiguracionSistemaModel(**VALORES_DEFAULT)
    db.add(configuracion)
    db.commit()
    db.refresh(configuracion)
    return configuracion


def serializar_configuracion(configuracion: ConfiguracionSistemaModel, db: Session, id_convocatoria: int | None = None):
    convocatoria = obtener_convocatoria_principal(db, id_convocatoria)
    inscripcion_estado, inscripcion_motivo = calcular_estado_inscripcion_empresas(convocatoria)

    return {
        "id_configuracion": configuracion.id_configuracion,
        "nombre_sistema": configuracion.nombre_sistema or VALORES_DEFAULT["nombre_sistema"],
        "escuela_facultad": configuracion.escuela_facultad or VALORES_DEFAULT["escuela_facultad"],
        "correo_institucional": configuracion.correo_institucional or VALORES_DEFAULT["correo_institucional"],
        "estado_sistema": configuracion.estado_sistema or VALORES_DEFAULT["estado_sistema"],
        "inscripcion_empresas_estado": inscripcion_estado,
        "inscripcion_empresas_motivo": inscripcion_motivo,
        "ciclo_escolar": configuracion.ciclo_escolar or VALORES_DEFAULT["ciclo_escolar"],
        "hero_titulo": configuracion.hero_titulo or VALORES_DEFAULT["hero_titulo"],
        "hero_subtitulo": configuracion.hero_subtitulo or VALORES_DEFAULT["hero_subtitulo"],
        "id_convocatoria_principal": convocatoria.id_convocatoria if convocatoria is not None else None,
        "convocatoria_nombre": convocatoria.nombre if convocatoria is not None else "Sin convocatoria principal",
        "convocatoria_inicio": convocatoria.fecha_inicio_general if convocatoria is not None else None,
        "convocatoria_cierre": convocatoria.fecha_cierre_general if convocatoria is not None else None,
        "convocatoria_empresas_inicio": convocatoria.fecha_inicio_empresas if convocatoria is not None else None,
        "convocatoria_empresas_cierre": convocatoria.fecha_cierre_empresas if convocatoria is not None else None,
        "convocatoria_periodo": convocatoria.tipo_periodo if convocatoria is not None else None,
        "convocatoria_estado": convocatoria.estado if convocatoria is not None else None,
        "soporte_telefono": configuracion.soporte_telefono or VALORES_DEFAULT["soporte_telefono"],
        "ultima_actualizacion": configuracion.ultima_actualizacion,
    }


@router.get("/", response_model=ConfiguracionSistemaResponse)
def obtener_configuracion_sistema(db: Session = Depends(obtener_db)):
    configuracion = obtener_o_crear_configuracion(db)
    return serializar_configuracion(configuracion, db)


@router.put(
    "/",
    response_model=ConfiguracionSistemaResponse,
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)
def actualizar_configuracion_sistema(
    datos: ConfiguracionSistemaUpdate,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    configuracion = obtener_o_crear_configuracion(db)
    estado_anterior = configuracion.estado_sistema
    datos_actualizar = datos.model_dump()

    id_convocatoria = datos_actualizar.pop("id_convocatoria_principal", None)
    datos_actualizar.pop("inscripcion_empresas_estado", None)

    datos_actualizar["nombre_sistema"] = validar_texto_requerido(
        datos_actualizar.get("nombre_sistema"),
        "Nombre del sistema",
    )
    datos_actualizar["escuela_facultad"] = validar_texto_requerido(
        datos_actualizar.get("escuela_facultad"),
        "Escuela / Facultad",
    )
    datos_actualizar["correo_institucional"] = validar_texto_requerido(
        str(datos_actualizar.get("correo_institucional") or ""),
        "Correo institucional",
    ).lower()
    datos_actualizar["estado_sistema"] = validar_texto_requerido(
        datos_actualizar.get("estado_sistema"),
        "Estado del sistema",
    )
    if datos_actualizar["estado_sistema"] not in ESTADOS_SISTEMA:
        raise HTTPException(status_code=400, detail="Estado del sistema no valido")
    datos_actualizar["ciclo_escolar"] = validar_texto_requerido(
        datos_actualizar.get("ciclo_escolar"),
        "Ciclo escolar",
    )
    datos_actualizar["hero_titulo"] = validar_texto_requerido(
        datos_actualizar.get("hero_titulo"),
        "Titulo principal",
    )
    datos_actualizar["hero_subtitulo"] = validar_texto_requerido(
        datos_actualizar.get("hero_subtitulo"),
        "Texto descriptivo principal",
    )
    datos_actualizar["soporte_telefono"] = validar_telefono(
        datos_actualizar.get("soporte_telefono")
    )

    if id_convocatoria is not None:
        convocatoria = (
            db.query(ConvocatoriaModel)
            .filter(ConvocatoriaModel.id_convocatoria == id_convocatoria)
            .first()
        )
        if convocatoria is None:
            raise HTTPException(status_code=404, detail="La convocatoria seleccionada no existe")

    for campo, valor in datos_actualizar.items():
        if hasattr(configuracion, campo):
            setattr(configuracion, campo, valor)

    db.commit()
    db.refresh(configuracion)
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Editar configuracion",
        "configuracion_sistema",
        "Admin actualizo la configuracion del sistema",
        "configuracion_sistema",
        configuracion.id_configuracion,
    )
    if estado_anterior != configuracion.estado_sistema:
        registrar_bitacora(
            db,
            usuario_actual.id_usuario,
            "Cambiar estado_sistema",
            "configuracion_sistema",
            f"Admin cambio estado_sistema de {estado_anterior} a {configuracion.estado_sistema}",
            "configuracion_sistema",
            configuracion.id_configuracion,
        )
    return serializar_configuracion(configuracion, db, id_convocatoria)
