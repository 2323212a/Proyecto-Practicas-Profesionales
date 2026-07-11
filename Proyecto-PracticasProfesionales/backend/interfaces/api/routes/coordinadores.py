from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.coordinador import CoordinadorModel
from interfaces.api.schemas.coordinador import CoordinadorCreate, CoordinadorResponse, CoordinadorUpdate
from interfaces.api.service_factory import PerfilService


router = APIRouter(prefix="/coordinadores", tags=["Coordinadores"])


@router.get("/", response_model=list[CoordinadorResponse])
def listar_coordinadores(db: Session = Depends(obtener_db)):
    return db.query(CoordinadorModel).all()


@router.get("/{id_coordinador}", response_model=CoordinadorResponse)
def obtener_coordinador(id_coordinador: int, db: Session = Depends(obtener_db)):
    coordinador = db.query(CoordinadorModel).filter(
        CoordinadorModel.id_coordinador == id_coordinador
    ).first()
    if coordinador is None:
        raise HTTPException(status_code=404, detail="Coordinador no encontrado")
    return coordinador


@router.post("/", response_model=CoordinadorResponse)
def crear_coordinador(coordinador: CoordinadorCreate, db: Session = Depends(obtener_db)):
    PerfilService(db).validar_usuario_para_perfil(coordinador.id_usuario, "Coordinador")
    nuevo_coordinador = CoordinadorModel(**coordinador.model_dump())
    db.add(nuevo_coordinador)
    db.commit()
    db.refresh(nuevo_coordinador)
    return nuevo_coordinador


@router.put("/{id_coordinador}", response_model=CoordinadorResponse)
def actualizar_coordinador(
    id_coordinador: int,
    datos: CoordinadorUpdate,
    db: Session = Depends(obtener_db)
):
    coordinador = db.query(CoordinadorModel).filter(
        CoordinadorModel.id_coordinador == id_coordinador
    ).first()
    if coordinador is None:
        raise HTTPException(status_code=404, detail="Coordinador no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(coordinador, campo, valor)

    db.commit()
    db.refresh(coordinador)
    return coordinador


@router.delete("/{id_coordinador}")
def eliminar_coordinador(id_coordinador: int, db: Session = Depends(obtener_db)):
    coordinador = db.query(CoordinadorModel).filter(
        CoordinadorModel.id_coordinador == id_coordinador
    ).first()
    if coordinador is None:
        raise HTTPException(status_code=404, detail="Coordinador no encontrado")

    db.delete(coordinador)
    db.commit()
    return {"mensaje": "Coordinador eliminado correctamente"}
