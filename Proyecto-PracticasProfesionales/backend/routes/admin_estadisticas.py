from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.dependencies import obtener_db

from models.usuario import UsuarioModel
from models.alumno import AlumnoModel
from models.documento import DocumentoModel
from models.expediente import ExpedienteModel
from models.convocatoria import ConvocatoriaModel
from models.rol import RolModel
from models.carrera import CarreraModel
from models.tipo_documento import TipoDocumentoModel


router = APIRouter(
    prefix="/admin/estadisticas",
    tags=["Admin Estadísticas"]
)


@router.get("/")
def obtener_estadisticas_admin(
    db: Session = Depends(obtener_db)
):
    roles = db.query(RolModel).count()
    carreras = db.query(CarreraModel).count()
    convocatorias = db.query(ConvocatoriaModel).count()
    tipos_documento = db.query(TipoDocumentoModel).count()

    return {
        "usuarios": db.query(UsuarioModel).count(),
        "usuarios_activos": db.query(UsuarioModel)
        .filter(UsuarioModel.estado == "Activo")
        .count(),
        "usuarios_inactivos": db.query(UsuarioModel)
        .filter(UsuarioModel.estado == "Inactivo")
        .count(),

        "alumnos": db.query(AlumnoModel).count(),
        "documentos": db.query(DocumentoModel).count(),
        "expedientes": db.query(ExpedienteModel).count(),

        "roles": roles,
        "carreras": carreras,
        "convocatorias": convocatorias,
        "tipos_documento": tipos_documento,
        "catalogos_total": carreras + convocatorias + tipos_documento,

        "reportes_generados": 0,

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