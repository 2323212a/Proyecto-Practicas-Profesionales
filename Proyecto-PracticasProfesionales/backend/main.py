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

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema Integral de Prácticas Profesionales",
    version="1.0.0"
)

app.include_router(documentos_router)
app.include_router(roles_router)
app.include_router(usuarios_router)
app.include_router(carreras_router)
app.include_router(alumnos_router)

@app.get("/")
def root():
    return {
        "mensaje": "Backend funcionando correctamente"
    }