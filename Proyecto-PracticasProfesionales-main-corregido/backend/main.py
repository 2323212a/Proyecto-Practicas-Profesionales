# ruff: noqa: F401
from pathlib import Path
import os
import asyncio

from fastapi import Depends, FastAPI
from fastapi.staticfiles import StaticFiles
from infrastructure.database.connection import Base, engine
from infrastructure.database.schema_updates import ensure_runtime_schema
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import requerir_roles
from interfaces.api.routes.documentos import router as documentos_router
from interfaces.api.routes.direccion import router as direccion_router
from infrastructure.persistence.models.documento import DocumentoModel
from interfaces.api.routes.roles import router as roles_router
from infrastructure.persistence.models.rol import RolModel
from interfaces.api.routes.usuarios import router as usuarios_router
from infrastructure.persistence.models.usuario import UsuarioModel
from interfaces.api.routes.carreras import router as carreras_router
from infrastructure.persistence.models.carrera import CarreraModel
from interfaces.api.routes.alumnos import router as alumnos_router
from interfaces.api.routes.alumno_documentos import router as alumno_documentos_router
from interfaces.api.routes.alumno_horas import router as alumno_horas_router
from interfaces.api.routes.alumno_padron import router as alumno_padron_router
from interfaces.api.routes.alumno_reportes import router as alumno_reportes_router
from interfaces.api.routes.empresa_documentos import router as empresa_documentos_router
from interfaces.api.routes.seguimiento_practicas import router as seguimiento_practicas_router
from infrastructure.persistence.models.alumno import AlumnoModel
from interfaces.api.routes.convocatorias import router as convocatorias_router
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from interfaces.api.routes.configuracion_sistema import router as configuracion_sistema_router
from infrastructure.persistence.models.configuracion_sistema import ConfiguracionSistemaModel
from interfaces.api.routes.tipos_documento import router as tipos_documento_router
from infrastructure.persistence.models.tipo_documento import TipoDocumentoModel
from interfaces.api.routes.expedientes import router as expedientes_router
from infrastructure.persistence.models.expediente import ExpedienteModel
from interfaces.api.routes.auth import router as auth_router
from interfaces.api.routes.unidad import router as unidad_router
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from interfaces.api.routes.importacion import router as importacion_router
from interfaces.api.routes.admin_estadisticas import router as admin_estadisticas_router
from interfaces.api.routes.admin_reportes import router as admin_reportes_router
from interfaces.api.routes.asesor import router as asesor_router
from interfaces.api.routes.asignaciones import router as asignaciones_router
from interfaces.api.routes.bitacora_auditoria import router as bitacora_auditoria_router
from interfaces.api.routes.convenios import router as convenios_router
from interfaces.api.routes.coord_unidades_empresas import router as coord_unidades_empresas_router
from interfaces.api.routes.coordinador_asignacion_docentes import router as coordinador_asignacion_docentes_router
from interfaces.api.routes.coordinador_confirmacion_asignaciones import router as coordinador_confirmacion_asignaciones_router
from interfaces.api.routes.coordinador_documentos import router as coordinador_documentos_router
from interfaces.api.routes.coordinador_liberacion import router as coordinador_liberacion_router
from interfaces.api.routes.coordinadores import router as coordinadores_router
from interfaces.api.routes.docentes import router as docentes_router
from interfaces.api.routes.empresas import router as empresas_router
from interfaces.api.routes.evaluaciones import router as evaluaciones_router
from interfaces.api.routes.horas import router as horas_router
from interfaces.api.routes.liberaciones import router as liberaciones_router
from interfaces.api.routes.notificaciones import router as notificaciones_router
from interfaces.api.routes.observaciones import router as observaciones_router
from interfaces.api.routes.reportes import router as reportes_router
from interfaces.api.routes.responsables_empresa import router as responsables_empresa_router
from interfaces.api.routes.selecciones_empresa import router as selecciones_empresa_router
from interfaces.api.routes.vacantes import router as vacantes_router
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.bitacora_auditoria import BitacoraAuditoriaModel
from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.coordinador import CoordinadorModel
from infrastructure.persistence.models.docente_asesor import DocenteAsesorModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.solicitud_empresa import SolicitudEmpresaModel
from infrastructure.persistence.models.evaluacion import EvaluacionModel
from infrastructure.persistence.models.evaluacion_empresa_alumno import EvaluacionEmpresaAlumnoModel
from infrastructure.persistence.models.formato_documento import FormatoDocumentoModel
from infrastructure.persistence.models.documento_empresa import DocumentoEmpresaModel
from infrastructure.persistence.models.horas import HorasModel
from infrastructure.persistence.models.incidencia_practica import IncidenciaPracticaModel
from infrastructure.persistence.models.formato_empresa import FormatoEmpresaModel
from infrastructure.persistence.models.liberacion import LiberacionModel
from infrastructure.persistence.models.notificacion import NotificacionModel
from infrastructure.persistence.models.observacion import ObservacionModel
from infrastructure.persistence.models.reporte import ReporteModel
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel
from infrastructure.persistence.models.seleccion_empresa import SeleccionEmpresaModel
from infrastructure.persistence.models.vacante import VacanteModel
from infrastructure.persistence.models.tipo_documento_empresa import TipoDocumentoEmpresaModel
from infrastructure.persistence.models.tipo_practica import TipoPracticaModel

EMAIL_FEATURE_ENABLED = os.getenv("EMAIL_FEATURE_ENABLED", "1") == "1"
EMAIL_QUEUE_WORKER_ENABLED = os.getenv("EMAIL_QUEUE_WORKER_ENABLED", "1") == "1"

if EMAIL_FEATURE_ENABLED:
    from infrastructure.persistence.models.cola_correos import ColaCorreosModel
    from interfaces.api.routes.cola_correos import router as cola_correos_router
else:
    cola_correos_router = None

if EMAIL_FEATURE_ENABLED and EMAIL_QUEUE_WORKER_ENABLED:
    from app.services.cola_correos_service import worker_cola_correos
else:
    worker_cola_correos = None

Base.metadata.create_all(bind=engine)
ensure_runtime_schema(engine)

app = FastAPI(
    title="Sistema Integral de Prácticas Profesionales",
    version="1.0.0"
)
app.state.email_queue_task = None
UPLOADS_DIR = Path(__file__).resolve().parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=str(UPLOADS_DIR)), name="uploads")

cors_origins = [
    origin.strip()
    for origin in os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://127.0.0.1:5173",
    ).split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(documentos_router)
app.include_router(roles_router)
app.include_router(usuarios_router)
app.include_router(carreras_router)
app.include_router(alumnos_router)
app.include_router(alumno_documentos_router)
app.include_router(alumno_horas_router)
app.include_router(alumno_padron_router)
app.include_router(alumno_reportes_router)
app.include_router(empresa_documentos_router)
app.include_router(seguimiento_practicas_router)
app.include_router(convocatorias_router)
app.include_router(tipos_documento_router)
app.include_router(expedientes_router)
app.include_router(auth_router)
app.include_router(unidad_router)
app.include_router(importacion_router)
app.include_router(admin_estadisticas_router)
app.include_router(admin_reportes_router)
if cola_correos_router is not None:
    app.include_router(cola_correos_router)
app.include_router(asesor_router)
app.include_router(configuracion_sistema_router)
app.include_router(empresas_router)
app.include_router(responsables_empresa_router)
app.include_router(docentes_router)
app.include_router(coordinadores_router)
app.include_router(coordinador_asignacion_docentes_router)
app.include_router(coordinador_confirmacion_asignaciones_router)
app.include_router(coordinador_documentos_router)
app.include_router(coordinador_liberacion_router)
app.include_router(coord_unidades_empresas_router)
app.include_router(convenios_router)
app.include_router(vacantes_router)
app.include_router(selecciones_empresa_router)
app.include_router(asignaciones_router)
app.include_router(horas_router)
app.include_router(evaluaciones_router)
app.include_router(liberaciones_router)
app.include_router(reportes_router)
app.include_router(notificaciones_router)
app.include_router(observaciones_router)
app.include_router(bitacora_auditoria_router)
app.include_router(direccion_router)


@app.on_event("startup")
async def startup_email_queue_worker() -> None:
    if worker_cola_correos is not None and app.state.email_queue_task is None:
        app.state.email_queue_task = asyncio.create_task(worker_cola_correos())


@app.on_event("shutdown")
async def shutdown_email_queue_worker() -> None:
    tarea = app.state.email_queue_task
    if tarea is not None:
        tarea.cancel()
        try:
            await tarea
        except asyncio.CancelledError:
            pass
        app.state.email_queue_task = None

@app.get("/")
def root():
    return {
        "mensaje": "Backend funcionando correctamente"
    }


@app.get(
    "/tipos-practica/",
    dependencies=[
        Depends(
            requerir_roles(
                [
                    "Administrador",
                    "Coordinador de Practicas",
                    "Coordinador de Unidades Receptoras",
                    "Unidad Receptora",
                ]
            )
        )
    ],
)
def listar_tipos_practica(db=Depends(obtener_db)):
    rows = db.execute(
        text(
            """
            SELECT id_tipo_practica, nombre, horas_requeridas, activo
            FROM tipo_practica
            WHERE activo = 1
            ORDER BY id_tipo_practica
            """
        )
    ).mappings()
    return [dict(row) for row in rows]
