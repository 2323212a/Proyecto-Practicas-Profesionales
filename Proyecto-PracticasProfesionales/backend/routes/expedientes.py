from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from schemas.expediente import ExpedienteCreate, ExpedienteResponse
from services.expediente_service import ExpedienteService


router = APIRouter(
    prefix="/expedientes",
    tags=["Expedientes"]
)


@router.get("/", response_model=list[ExpedienteResponse])
def listar_expedientes(db: Session = Depends(obtener_db)):
    return ExpedienteService(db).listar()


@router.get("/{id_expediente}", response_model=ExpedienteResponse)
def obtener_expediente(
    id_expediente: int,
    db: Session = Depends(obtener_db)
):
    expediente = ExpedienteService(db).obtener_por_id(id_expediente)

    if expediente is None:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")

    return expediente


@router.post("/", response_model=ExpedienteResponse)
def crear_expediente(
    expediente: ExpedienteCreate,
    db: Session = Depends(obtener_db)
):
    return ExpedienteService(db).crear(expediente)