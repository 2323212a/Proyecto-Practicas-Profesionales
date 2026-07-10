from fastapi import FastAPI
from database.connection import Base, engine
from routes.documentos import router as documentos_router
from models.documento import DocumentoModel
from routes.roles import router as roles_router
from models.rol import RolModel
from routes.usuarios import router as usuarios_router
from models.usuario import UsuarioModel
from routes.carreras import router as carreras_router
from models.carrera import CarreraModel
from routes.alumnos import router as alumnos_router
from models.alumno import AlumnoModel
from routes.convocatorias import router as convocatorias_router
from models.convocatoria import ConvocatoriaModel
from routes.tipos_documento import router as tipos_documento_router
from models.tipo_documento import TipoDocumentoModel
from routes.expedientes import router as expedientes_router
from models.expediente import ExpedienteModel
from routes.auth import router as auth_router
from fastapi.middleware.cors import CORSMiddleware
from routes.importacion import router as importacion_router
from routes.admin_estadisticas import router as admin_estadisticas_router
from coord_unidades.presentation.routers.empresa_router import (
    router as empresa_router,
)
from coord_unidades.presentation.routers.convenio_router import (
    router as convenio_router,
)
from coord_unidades.presentation.routers.responsable_empresa_router import (
    router as responsable_empresa_router,
)
from coord_unidades.presentation.routers.padron_empresarial_router import (
    router as padron_empresarial_router,
)
from coord_unidades.presentation.routers.vacante_router import (
    router as vacante_router,
)
from coord_unidades.presentation.routers.notificacion_router import (
    router as notificacion_router,
)
from coord_unidades.presentation.routers.solicitud_unidad_router import (
    router as solicitud_unidad_router,
)
from coord_unidades.presentation.routers.solicitud_unidad_coordinador_router import (
    router as solicitud_unidad_coordinador_router,
)
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema Integral de Prácticas Profesionales",
    version="1.0.0"
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


app.include_router(documentos_router)
app.include_router(roles_router)
app.include_router(usuarios_router)
app.include_router(carreras_router)
app.include_router(alumnos_router)
app.include_router(convocatorias_router)
app.include_router(tipos_documento_router)
app.include_router(expedientes_router)
app.include_router(auth_router)
app.include_router(importacion_router)
app.include_router(admin_estadisticas_router)
app.include_router(empresa_router)
app.include_router(convenio_router)
app.include_router(responsable_empresa_router)
app.include_router(padron_empresarial_router)
app.include_router(vacante_router)
app.include_router(notificacion_router)
app.include_router(solicitud_unidad_router)
app.include_router(solicitud_unidad_coordinador_router)

@app.get("/")
def root():
    return {
        "mensaje": "Backend funcionando correctamente"
    }
