from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import requerir_roles

from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.documento import DocumentoModel
from infrastructure.persistence.models.expediente import ExpedienteModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.rol import RolModel
from infrastructure.persistence.models.carrera import CarreraModel
from infrastructure.persistence.models.tipo_documento import TipoDocumentoModel
from infrastructure.persistence.models.reporte import ReporteModel


router = APIRouter(
    prefix="/admin/estadisticas",
    tags=["Admin Estadisticas"],
    dependencies=[Depends(requerir_roles(["Administrador", "Direccion"]))]
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

        "reportes_generados": db.query(ReporteModel).count(),

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
