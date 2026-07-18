from fastapi import APIRouter, Depends
from sqlalchemy import inspect, text
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import requerir_roles

from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.rol import RolModel
from infrastructure.persistence.models.carrera import CarreraModel


router = APIRouter(
    prefix="/admin/estadisticas",
    tags=["Admin Estadisticas"],
    dependencies=[Depends(requerir_roles(["Administrador", "Direccion"]))]
)


def _tabla_existe(db: Session, tabla: str) -> bool:
    return inspect(db.bind).has_table(tabla)


def _conteo_tabla(db: Session, tabla: str) -> int:
    if not _tabla_existe(db, tabla):
        return 0
    try:
        return int(db.execute(text(f"SELECT COUNT(*) FROM `{tabla}`")).scalar() or 0)
    except SQLAlchemyError:
        db.rollback()
        return 0


def _conteo_tablas_posibles(db: Session, *tablas: str) -> int:
    for tabla in tablas:
        if _tabla_existe(db, tabla):
            return _conteo_tabla(db, tabla)
    return 0


@router.get("/")
def obtener_estadisticas_admin(
    db: Session = Depends(obtener_db)
):
    roles = db.query(RolModel).count()
    carreras = db.query(CarreraModel).count()
    convocatorias = db.query(ConvocatoriaModel).count()
    tipos_documento = (
        _conteo_tablas_posibles(db, "tipo_documento_alumno", "tipo_documento")
        + _conteo_tabla(db, "tipo_documento_empresa")
    )
    documentos = (
        _conteo_tablas_posibles(db, "documento_alumno", "documento")
        + _conteo_tabla(db, "documento_empresa")
    )

    return {
        "usuarios": db.query(UsuarioModel).count(),
        "usuarios_activos": db.query(UsuarioModel)
        .filter(UsuarioModel.estado == "Activo")
        .count(),
        "usuarios_inactivos": db.query(UsuarioModel)
        .filter(UsuarioModel.estado == "Inactivo")
        .count(),

        "alumnos": db.query(AlumnoModel).count(),
        "documentos": documentos,
        "expedientes": _conteo_tablas_posibles(db, "expediente_alumno", "expediente"),

        "roles": roles,
        "carreras": carreras,
        "convocatorias": convocatorias,
        "tipos_documento": tipos_documento,
        "catalogos_total": carreras + convocatorias + tipos_documento,

        "reportes_generados": _conteo_tablas_posibles(db, "reporte_practica", "reporte"),

        "estado_sistema": {
            "servidor": "Operativo",
            "base_datos": "Operativo",
            "servicio_correo": "No configurado",
            "almacenamiento": "Local",
            "backup": "No configurado",
            "sesiones_activas": db.query(UsuarioModel)
            .filter(UsuarioModel.estado == "Activo")
            .count(),
        }
    }
