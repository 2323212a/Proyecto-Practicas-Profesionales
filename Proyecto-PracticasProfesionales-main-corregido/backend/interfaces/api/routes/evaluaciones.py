from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import requerir_roles
from infrastructure.persistence.models.evaluacion import EvaluacionModel
from interfaces.api.schemas.evaluacion import EvaluacionCreate, EvaluacionResponse, EvaluacionUpdate


router = APIRouter(
    prefix="/evaluaciones", tags=["Evaluaciones"],
    dependencies=[Depends(requerir_roles(['Administrador', 'Coordinador de Practicas']))],
)


@router.get("/", response_model=list[EvaluacionResponse])
def listar_evaluaciones(db: Session = Depends(obtener_db)):
    return db.query(EvaluacionModel).all()


@router.get("/{id_evaluacion}", response_model=EvaluacionResponse)
def obtener_evaluacion(id_evaluacion: int, db: Session = Depends(obtener_db)):
    evaluacion = db.query(EvaluacionModel).filter(
        EvaluacionModel.id_evaluacion == id_evaluacion
    ).first()
    if evaluacion is None:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")
    return evaluacion


@router.post("/", response_model=EvaluacionResponse)
def crear_evaluacion(evaluacion: EvaluacionCreate, db: Session = Depends(obtener_db)):
    nueva_evaluacion = EvaluacionModel(**evaluacion.model_dump())
    db.add(nueva_evaluacion)
    db.commit()
    db.refresh(nueva_evaluacion)
    return nueva_evaluacion


@router.put("/{id_evaluacion}", response_model=EvaluacionResponse)
def actualizar_evaluacion(
    id_evaluacion: int,
    datos: EvaluacionUpdate,
    db: Session = Depends(obtener_db)
):
    evaluacion = db.query(EvaluacionModel).filter(
        EvaluacionModel.id_evaluacion == id_evaluacion
    ).first()
    if evaluacion is None:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(evaluacion, campo, valor)

    db.commit()
    db.refresh(evaluacion)
    return evaluacion


@router.delete("/{id_evaluacion}")
def eliminar_evaluacion(id_evaluacion: int, db: Session = Depends(obtener_db)):
    evaluacion = db.query(EvaluacionModel).filter(
        EvaluacionModel.id_evaluacion == id_evaluacion
    ).first()
    if evaluacion is None:
        raise HTTPException(status_code=404, detail="Evaluación no encontrada")

    db.delete(evaluacion)
    db.commit()
    return {"mensaje": "Evaluación eliminada correctamente"}
