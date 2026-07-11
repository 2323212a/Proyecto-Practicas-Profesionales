from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.observacion import ObservacionModel
from interfaces.api.schemas.observacion import ObservacionCreate, ObservacionResponse


router = APIRouter(prefix="/observaciones", tags=["Observaciones"])


@router.get("/", response_model=list[ObservacionResponse])
def listar_observaciones(db: Session = Depends(obtener_db)):
    return db.query(ObservacionModel).all()


@router.get("/{id_observacion}", response_model=ObservacionResponse)
def obtener_observacion(id_observacion: int, db: Session = Depends(obtener_db)):
    observacion = db.query(ObservacionModel).filter(
        ObservacionModel.id_observacion == id_observacion
    ).first()
    if observacion is None:
        raise HTTPException(status_code=404, detail="Observación no encontrada")
    return observacion


@router.post("/", response_model=ObservacionResponse)
def crear_observacion(observacion: ObservacionCreate, db: Session = Depends(obtener_db)):
    nueva_observacion = ObservacionModel(**observacion.model_dump())
    db.add(nueva_observacion)
    db.commit()
    db.refresh(nueva_observacion)
    return nueva_observacion


@router.delete("/{id_observacion}")
def eliminar_observacion(id_observacion: int, db: Session = Depends(obtener_db)):
    observacion = db.query(ObservacionModel).filter(
        ObservacionModel.id_observacion == id_observacion
    ).first()
    if observacion is None:
        raise HTTPException(status_code=404, detail="Observación no encontrada")

    db.delete(observacion)
    db.commit()
    return {"mensaje": "Observación eliminada correctamente"}
