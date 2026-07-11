from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.liberacion import LiberacionModel
from interfaces.api.schemas.liberacion import LiberacionCreate, LiberacionResponse, LiberacionUpdate


router = APIRouter(prefix="/liberaciones", tags=["Liberaciones"])


@router.get("/", response_model=list[LiberacionResponse])
def listar_liberaciones(db: Session = Depends(obtener_db)):
    return db.query(LiberacionModel).all()


@router.get("/{id_liberacion}", response_model=LiberacionResponse)
def obtener_liberacion(id_liberacion: int, db: Session = Depends(obtener_db)):
    liberacion = db.query(LiberacionModel).filter(
        LiberacionModel.id_liberacion == id_liberacion
    ).first()
    if liberacion is None:
        raise HTTPException(status_code=404, detail="Liberación no encontrada")
    return liberacion


@router.post("/", response_model=LiberacionResponse)
def crear_liberacion(liberacion: LiberacionCreate, db: Session = Depends(obtener_db)):
    nueva_liberacion = LiberacionModel(**liberacion.model_dump())
    db.add(nueva_liberacion)
    db.commit()
    db.refresh(nueva_liberacion)
    return nueva_liberacion


@router.put("/{id_liberacion}", response_model=LiberacionResponse)
def actualizar_liberacion(
    id_liberacion: int,
    datos: LiberacionUpdate,
    db: Session = Depends(obtener_db)
):
    liberacion = db.query(LiberacionModel).filter(
        LiberacionModel.id_liberacion == id_liberacion
    ).first()
    if liberacion is None:
        raise HTTPException(status_code=404, detail="Liberación no encontrada")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(liberacion, campo, valor)

    db.commit()
    db.refresh(liberacion)
    return liberacion


@router.patch("/{id_liberacion}/emitir", response_model=LiberacionResponse)
def emitir_liberacion(id_liberacion: int, db: Session = Depends(obtener_db)):
    liberacion = db.query(LiberacionModel).filter(
        LiberacionModel.id_liberacion == id_liberacion
    ).first()
    if liberacion is None:
        raise HTTPException(status_code=404, detail="Liberación no encontrada")

    liberacion.estado_liberacion = "Emitida"
    db.commit()
    db.refresh(liberacion)
    return liberacion


@router.delete("/{id_liberacion}")
def eliminar_liberacion(id_liberacion: int, db: Session = Depends(obtener_db)):
    liberacion = db.query(LiberacionModel).filter(
        LiberacionModel.id_liberacion == id_liberacion
    ).first()
    if liberacion is None:
        raise HTTPException(status_code=404, detail="Liberación no encontrada")

    db.delete(liberacion)
    db.commit()
    return {"mensaje": "Liberación eliminada correctamente"}
