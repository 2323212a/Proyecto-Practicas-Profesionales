from __future__ import annotations
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import requerir_roles
from interfaces.api.schemas.horas import HorasCreate, HorasResponse, HorasUpdate
from interfaces.api.service_factory import HorasService


router = APIRouter(
    prefix="/horas", tags=["Horas"],
    dependencies=[Depends(requerir_roles(['Administrador', 'Coordinador de Practicas']))],
)


@router.get("/", response_model=list[HorasResponse])
def listar_horas(db: Session = Depends(obtener_db)):
    return HorasService(db).listar()


@router.get("/asignacion/{id_asignacion}", response_model=list[HorasResponse])
def listar_horas_asignacion(id_asignacion: int, db: Session = Depends(obtener_db)):
    return HorasService(db).listar_por_asignacion(id_asignacion)


@router.get("/{id_horas}", response_model=HorasResponse)
def obtener_horas(id_horas: int, db: Session = Depends(obtener_db)):
    horas = HorasService(db).obtener_por_id(id_horas)
    if horas is None:
        raise HTTPException(status_code=404, detail="Registro de horas no encontrado")
    return horas


@router.post("/", response_model=HorasResponse)
def crear_horas(horas: HorasCreate, db: Session = Depends(obtener_db)):
    return HorasService(db).crear(horas)


@router.put("/{id_horas}", response_model=HorasResponse)
def actualizar_horas(
    id_horas: int,
    datos: HorasUpdate,
    db: Session = Depends(obtener_db)
):
    horas = HorasService(db).actualizar(id_horas, datos)
    if horas is None:
        raise HTTPException(status_code=404, detail="Registro de horas no encontrado")
    return horas


@router.patch("/{id_horas}/aprobar", response_model=HorasResponse)
def aprobar_horas(id_horas: int, db: Session = Depends(obtener_db)):
    horas = HorasService(db).aprobar(id_horas)
    if horas is None:
        raise HTTPException(status_code=404, detail="Registro de horas no encontrado")
    return horas


@router.patch("/{id_horas}/rechazar", response_model=HorasResponse)
def rechazar_horas(
    id_horas: int,
    observaciones: str | None = None,
    db: Session = Depends(obtener_db)
):
    horas = HorasService(db).rechazar(id_horas, observaciones)
    if horas is None:
        raise HTTPException(status_code=404, detail="Registro de horas no encontrado")
    return horas


@router.delete("/{id_horas}")
def eliminar_horas(id_horas: int, db: Session = Depends(obtener_db)):
    horas = HorasService(db).eliminar(id_horas)
    if horas is None:
        raise HTTPException(status_code=404, detail="Registro de horas no encontrado")
    return {"mensaje": "Registro de horas eliminado correctamente"}
