from fastapi import FastAPI
from database.connection import Base, engine
from routes.documentos import router as documentos_router
from models.documento import DocumentoModel

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Sistema Integral de Prácticas Profesionales",
    version="1.0.0"
)

app.include_router(documentos_router)


@app.get("/")
def root():
    return {
        "mensaje": "Backend funcionando correctamente"
    }