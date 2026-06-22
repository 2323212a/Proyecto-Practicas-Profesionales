from fastapi import FastAPI

app = FastAPI(
    title="Sistema Integral de Prácticas Profesionales",
    version="1.0.0"
)

@app.get("/")
def root():
    return {
        "mensaje": "Backend funcionando correctamente"
    }