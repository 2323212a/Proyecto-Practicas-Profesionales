from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import requerir_roles
from interfaces.api.schemas.expediente import ExpedienteCreate, ExpedienteResponse, ExpedienteUpdate
from interfaces.api.service_factory import ExpedienteService


router = APIRouter(
    prefix="/expedientes",
    tags=["Expedientes"],
    dependencies=[Depends(requerir_roles(['Administrador', 'Coordinador de Practicas']))],
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


@router.put("/{id_expediente}", response_model=ExpedienteResponse)
def actualizar_expediente(
    id_expediente: int,
    datos: ExpedienteUpdate,
    db: Session = Depends(obtener_db)
):
    expediente = ExpedienteService(db).actualizar(id_expediente, datos)

    if expediente is None:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")

    return expediente


@router.delete("/{id_expediente}")
def eliminar_expediente(
    id_expediente: int,
    db: Session = Depends(obtener_db)
):
    expediente = ExpedienteService(db).eliminar(id_expediente)

    if expediente is None:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")

    return {"mensaje": "Expediente eliminado correctamente"}
