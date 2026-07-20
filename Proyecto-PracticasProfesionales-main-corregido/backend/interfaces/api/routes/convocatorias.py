from datetime import date

from app.services.auditoria_service import registrar_bitacora
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from fastapi import HTTPException
from interfaces.api.schemas.convocatoria import ConvocatoriaCreate, ConvocatoriaResponse, ConvocatoriaUpdate
from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.security.auth_dependencies import obtener_usuario_actual
from infrastructure.security.auth_dependencies import requerir_roles


from interfaces.api.service_factory import ConvocatoriaService


router = APIRouter(
    prefix="/convocatorias",
    tags=["Convocatorias"],
    dependencies=[Depends(requerir_roles(['Administrador', 'Coordinador de Practicas']))],
)


ETAPAS_CONVOCATORIA = [
    ("Registro de empresas", "fecha_inicio_empresas", "fecha_cierre_empresas"),
    ("Documentación de alumnos", "fecha_inicio_documentos", "fecha_cierre_documentos"),
    ("Validación documental", "fecha_inicio_validacion", "fecha_cierre_validacion"),
    ("Selección de empresas", "fecha_inicio_seleccion", "fecha_cierre_seleccion"),
    ("Asignación", "fecha_inicio_asignacion", "fecha_cierre_asignacion"),
    ("Prácticas en curso", "fecha_inicio_practicas", "fecha_cierre_practicas"),
    ("Cierre administrativo", "fecha_inicio_cierre", "fecha_cierre_cierre"),
]


def calcular_fase_actual(convocatoria) -> str:
    fechas = [
        convocatoria.fecha_inicio_general,
        convocatoria.fecha_cierre_general,
        *[
            getattr(convocatoria, campo)
            for _, inicio, cierre in ETAPAS_CONVOCATORIA
            for campo in (inicio, cierre)
        ],
    ]
    fechas = [item for item in fechas if item is not None]
    if not fechas:
        return "Sin calendario"

    hoy = date.today()
    if convocatoria.fecha_inicio_general and hoy < convocatoria.fecha_inicio_general:
        return "Programada"

    for nombre, campo_inicio, campo_cierre in ETAPAS_CONVOCATORIA:
        inicio = getattr(convocatoria, campo_inicio)
        cierre = getattr(convocatoria, campo_cierre)
        if inicio and cierre and inicio <= hoy <= cierre:
            if campo_inicio == "fecha_inicio_seleccion":
                return "Seleccion"
            return nombre

    ultima_fecha = max(fechas)
    if hoy > ultima_fecha:
        return "Finalizada"
    return "Programada"


def serializar_convocatoria(convocatoria) -> dict:
    return {
        "id_convocatoria": convocatoria.id_convocatoria,
        "nombre": convocatoria.nombre,
        "tipo_periodo": convocatoria.tipo_periodo,
        "estado": convocatoria.estado,
        "fecha_inicio_general": convocatoria.fecha_inicio_general,
        "fecha_cierre_general": convocatoria.fecha_cierre_general,
        "fecha_inicio_empresas": convocatoria.fecha_inicio_empresas,
        "fecha_cierre_empresas": convocatoria.fecha_cierre_empresas,
        "fecha_inicio_documentos": convocatoria.fecha_inicio_documentos,
        "fecha_cierre_documentos": convocatoria.fecha_cierre_documentos,
        "fecha_inicio_validacion": convocatoria.fecha_inicio_validacion,
        "fecha_cierre_validacion": convocatoria.fecha_cierre_validacion,
        "fecha_inicio_seleccion": convocatoria.fecha_inicio_seleccion,
        "fecha_cierre_seleccion": convocatoria.fecha_cierre_seleccion,
        "fecha_inicio_asignacion": convocatoria.fecha_inicio_asignacion,
        "fecha_cierre_asignacion": convocatoria.fecha_cierre_asignacion,
        "fecha_inicio_practicas": convocatoria.fecha_inicio_practicas,
        "fecha_cierre_practicas": convocatoria.fecha_cierre_practicas,
        "fecha_inicio_cierre": convocatoria.fecha_inicio_cierre,
        "fecha_cierre_cierre": convocatoria.fecha_cierre_cierre,
        "observaciones": convocatoria.observaciones,
        "fase_actual": calcular_fase_actual(convocatoria),
    }


@router.get(
    "/",
    response_model=list[ConvocatoriaResponse]
)
def listar_convocatorias(
    db: Session = Depends(obtener_db)
):
    return [serializar_convocatoria(item) for item in ConvocatoriaService(db).listar()]


@router.get("/{id_convocatoria}", response_model=ConvocatoriaResponse)
def obtener_convocatoria(
    id_convocatoria: int,
    db: Session = Depends(obtener_db)
):
    convocatoria = ConvocatoriaService(db).obtener_por_id(id_convocatoria)

    if convocatoria is None:
        raise HTTPException(
            status_code=404,
            detail="Convocatoria no encontrada"
        )

    return serializar_convocatoria(convocatoria)


@router.post(
    "/",
    response_model=ConvocatoriaResponse,
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)
def crear_convocatoria(
    convocatoria: ConvocatoriaCreate,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    nueva_convocatoria = ConvocatoriaService(db).crear(convocatoria)
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Crear convocatoria",
        "convocatorias",
        f"Admin creo la convocatoria {nueva_convocatoria.nombre}",
        "convocatoria",
        nueva_convocatoria.id_convocatoria,
    )
    return serializar_convocatoria(nueva_convocatoria)

@router.put(
    "/{id_convocatoria}",
    response_model=ConvocatoriaResponse,
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)
def actualizar_convocatoria(
    id_convocatoria: int,
    convocatoria: ConvocatoriaUpdate,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    convocatoria_actualizada = ConvocatoriaService(db).actualizar(
        id_convocatoria,
        convocatoria
    )

    if convocatoria_actualizada is None:
        raise HTTPException(
            status_code=404,
            detail="Convocatoria no encontrada"
        )
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Editar convocatoria",
        "convocatorias",
        f"Admin edito la convocatoria {convocatoria_actualizada.nombre}",
        "convocatoria",
        convocatoria_actualizada.id_convocatoria,
    )

    return serializar_convocatoria(convocatoria_actualizada)


@router.delete(
    "/{id_convocatoria}",
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)
def eliminar_convocatoria(
    id_convocatoria: int,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    service = ConvocatoriaService(db)
    convocatoria = service.obtener_por_id(id_convocatoria)

    if convocatoria is None:
        raise HTTPException(
            status_code=404,
            detail="Convocatoria no encontrada"
        )
    nombre = convocatoria.nombre
    service.eliminar(id_convocatoria)
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Eliminar convocatoria",
        "convocatorias",
        f"Admin elimino la convocatoria {nombre}",
        "convocatoria",
        id_convocatoria,
    )

    return {"mensaje": "Convocatoria eliminada correctamente"}


@router.patch(
    "/{id_convocatoria}/desactivar",
    response_model=ConvocatoriaResponse,
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)
def desactivar_convocatoria(
    id_convocatoria: int,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    convocatoria = ConvocatoriaService(db).cambiar_estado(id_convocatoria, "Inactiva")
    if convocatoria is None:
        raise HTTPException(
            status_code=404,
            detail="Convocatoria no encontrada"
        )
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Desactivar convocatoria",
        "convocatorias",
        f"Admin desactivo la convocatoria {convocatoria.nombre}",
        "convocatoria",
        id_convocatoria,
    )
    return serializar_convocatoria(convocatoria)


@router.patch(
    "/{id_convocatoria}/cerrar",
    response_model=ConvocatoriaResponse,
    dependencies=[Depends(requerir_roles(["Administrador"]))],
)
def cerrar_convocatoria(
    id_convocatoria: int,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    convocatoria = ConvocatoriaService(db).cambiar_estado(id_convocatoria, "Cerrada")
    if convocatoria is None:
        raise HTTPException(
            status_code=404,
            detail="Convocatoria no encontrada"
        )
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Cerrar convocatoria",
        "convocatorias",
        f"Admin cerro la convocatoria {convocatoria.nombre}",
        "convocatoria",
        id_convocatoria,
    )
    return serializar_convocatoria(convocatoria)
