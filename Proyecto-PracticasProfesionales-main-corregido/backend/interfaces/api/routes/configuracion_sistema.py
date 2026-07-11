from __future__ import annotations

from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import requerir_roles
from infrastructure.persistence.models.configuracion_sistema import ConfiguracionSistemaModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from interfaces.api.schemas.configuracion_sistema import (
    ConfiguracionSistemaResponse,
    ConfiguracionSistemaUpdate,
)


router = APIRouter(
    prefix="/configuracion-sistema",
    tags=["Configuracion Sistema"],
)


VALORES_DEFAULT = {
    "nombre_sistema": "Sistema Integral de Prácticas Profesionales",
    "escuela_facultad": "ETDA C-I",
    "correo_institucional": "practicas@unach.mx",
    "estado_sistema": "Activo",
    "ciclo_escolar": "Ciclo Escolar 2026-2027",
    "hero_titulo": "Sistema Integral de Prácticas Profesionales",
    "hero_subtitulo": (
        "Plataforma institucional para la gestión, seguimiento y control "
        "de las prácticas profesionales."
    ),
    "convocatoria_nombre": "Verano 2026",
    "convocatoria_inicio": date(2026, 6, 1),
    "convocatoria_cierre": date(2026, 7, 11),
    "soporte_telefono": "(961) 619-1200",
}


def obtener_convocatoria_principal(db: Session, id_convocatoria: int | None):
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
        .order_by(ConvocatoriaModel.fecha_inicio.desc())
        .first()
        or db.query(ConvocatoriaModel)
        .order_by(ConvocatoriaModel.fecha_inicio.desc())
        .first()
    )


def obtener_o_crear_configuracion(db: Session):
    configuracion = (
        db.query(ConfiguracionSistemaModel)
        .order_by(ConfiguracionSistemaModel.id_configuracion.asc())
        .first()
    )
    if configuracion is not None:
        convocatoria = obtener_convocatoria_principal(
            db,
            configuracion.id_convocatoria_principal,
        )
        if convocatoria is not None and configuracion.id_convocatoria_principal is None:
            configuracion.id_convocatoria_principal = convocatoria.id_convocatoria
            db.commit()
            db.refresh(configuracion)
        return configuracion

    convocatoria = obtener_convocatoria_principal(db, None)
    datos = dict(VALORES_DEFAULT)
    if convocatoria is not None:
        datos.update(
            {
                "id_convocatoria_principal": convocatoria.id_convocatoria,
                "convocatoria_nombre": convocatoria.nombre,
                "convocatoria_inicio": convocatoria.fecha_inicio,
                "convocatoria_cierre": convocatoria.fecha_fin,
            }
        )

    configuracion = ConfiguracionSistemaModel(**datos)
    db.add(configuracion)
    db.commit()
    db.refresh(configuracion)
    return configuracion


def serializar_configuracion(configuracion: ConfiguracionSistemaModel, db: Session):
    convocatoria = obtener_convocatoria_principal(
        db,
        configuracion.id_convocatoria_principal,
    )

    return {
        "id_configuracion": configuracion.id_configuracion,
        "nombre_sistema": configuracion.nombre_sistema,
        "escuela_facultad": configuracion.escuela_facultad,
        "correo_institucional": configuracion.correo_institucional,
        "estado_sistema": configuracion.estado_sistema,
        "ciclo_escolar": configuracion.ciclo_escolar,
        "hero_titulo": configuracion.hero_titulo,
        "hero_subtitulo": configuracion.hero_subtitulo,
        "id_convocatoria_principal": (
            convocatoria.id_convocatoria if convocatoria is not None else None
        ),
        "convocatoria_nombre": (
            convocatoria.nombre if convocatoria is not None else configuracion.convocatoria_nombre
        ),
        "convocatoria_inicio": (
            convocatoria.fecha_inicio if convocatoria is not None else configuracion.convocatoria_inicio
        ),
        "convocatoria_cierre": (
            convocatoria.fecha_fin if convocatoria is not None else configuracion.convocatoria_cierre
        ),
        "convocatoria_periodo": convocatoria.periodo if convocatoria is not None else None,
        "convocatoria_estado": convocatoria.estado if convocatoria is not None else None,
        "soporte_telefono": configuracion.soporte_telefono,
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
):
    configuracion = obtener_o_crear_configuracion(db)
    datos_actualizar = datos.model_dump()

    id_convocatoria = datos_actualizar.get("id_convocatoria_principal")
    if id_convocatoria is not None:
        convocatoria = (
            db.query(ConvocatoriaModel)
            .filter(ConvocatoriaModel.id_convocatoria == id_convocatoria)
            .first()
        )
        if convocatoria is None:
            raise HTTPException(
                status_code=404,
                detail="La convocatoria seleccionada no existe",
            )

    for campo, valor in datos_actualizar.items():
        setattr(configuracion, campo, valor)

    db.commit()
    db.refresh(configuracion)
    return serializar_configuracion(configuracion, db)
