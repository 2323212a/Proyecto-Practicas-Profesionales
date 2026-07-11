from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from interfaces.api.schemas.vacante import VacanteCreate, VacanteResponse, VacanteUpdate
from interfaces.api.service_factory import VacanteService


router = APIRouter(prefix="/vacantes", tags=["Vacantes"])


@router.get("/", response_model=list[VacanteResponse])
def listar_vacantes(db: Session = Depends(obtener_db)):
    return VacanteService(db).listar()


@router.get("/{id_vacante}", response_model=VacanteResponse)
def obtener_vacante(id_vacante: int, db: Session = Depends(obtener_db)):
    vacante = VacanteService(db).obtener_por_id(id_vacante)
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")
    return vacante


@router.post("/", response_model=VacanteResponse)
def crear_vacante(vacante: VacanteCreate, db: Session = Depends(obtener_db)):
    return VacanteService(db).crear(vacante)


@router.put("/{id_vacante}", response_model=VacanteResponse)
def actualizar_vacante(
    id_vacante: int,
    datos: VacanteUpdate,
    db: Session = Depends(obtener_db)
):
    vacante = VacanteService(db).actualizar(id_vacante, datos)
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")
    return vacante


@router.delete("/{id_vacante}")
def eliminar_vacante(id_vacante: int, db: Session = Depends(obtener_db)):
    vacante = VacanteService(db).eliminar(id_vacante)
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")
    return {"mensaje": "Vacante eliminada correctamente"}
