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
from routes import alumno_dashboard
from routes import alumno_documentacion
from routes import empresas
from routes import coordinador_documentos
from routes import preferencias_empresas
from routes import coordinador_seguimiento
from routes import notificaciones
from models.empresa import EmpresaModel
from models.vacante import Vacante
from models.preferencia_empresa import PreferenciaEmpresaModel



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
app.include_router(alumno_dashboard.router)
app.include_router(alumno_documentacion.router)
app.include_router(empresas.router)
app.include_router(coordinador_documentos.router)
app.include_router(preferencias_empresas.router)
app.include_router(coordinador_seguimiento.router)
app.include_router(notificaciones.router)

@app.get("/")
def root():
    return {
        "mensaje": "Backend funcionando correctamente"
    }