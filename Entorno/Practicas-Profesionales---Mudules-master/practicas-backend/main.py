from fastapi import FastAPI
from modules.expedientes.presentation.routers.documento_router import router
from modules.expedientes.infrastructure.database.models import Base
from modules.expedientes.infrastructure.database.connection import engine

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.include_router(router)
