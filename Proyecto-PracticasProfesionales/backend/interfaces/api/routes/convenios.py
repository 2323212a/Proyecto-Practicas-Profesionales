from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.convenio import ConvenioModel
from interfaces.api.schemas.convenio import ConvenioCreate, ConvenioResponse, ConvenioUpdate


router = APIRouter(prefix="/convenios", tags=["Convenios"])


@router.get("/", response_model=list[ConvenioResponse])
def listar_convenios(db: Session = Depends(obtener_db)):
    return db.query(ConvenioModel).all()


@router.get("/{id_convenio}", response_model=ConvenioResponse)
def obtener_convenio(id_convenio: int, db: Session = Depends(obtener_db)):
    convenio = db.query(ConvenioModel).filter(ConvenioModel.id_convenio == id_convenio).first()
    if convenio is None:
        raise HTTPException(status_code=404, detail="Convenio no encontrado")
    return convenio


@router.post("/", response_model=ConvenioResponse)
def crear_convenio(convenio: ConvenioCreate, db: Session = Depends(obtener_db)):
    nuevo_convenio = ConvenioModel(**convenio.model_dump())
    db.add(nuevo_convenio)
    db.commit()
    db.refresh(nuevo_convenio)
    return nuevo_convenio


@router.put("/{id_convenio}", response_model=ConvenioResponse)
def actualizar_convenio(
    id_convenio: int,
    datos: ConvenioUpdate,
    db: Session = Depends(obtener_db)
):
    convenio = db.query(ConvenioModel).filter(ConvenioModel.id_convenio == id_convenio).first()
    if convenio is None:
        raise HTTPException(status_code=404, detail="Convenio no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(convenio, campo, valor)

    db.commit()
    db.refresh(convenio)
    return convenio


@router.delete("/{id_convenio}")
def eliminar_convenio(id_convenio: int, db: Session = Depends(obtener_db)):
    convenio = db.query(ConvenioModel).filter(ConvenioModel.id_convenio == id_convenio).first()
    if convenio is None:
        raise HTTPException(status_code=404, detail="Convenio no encontrado")

    db.delete(convenio)
    db.commit()
    return {"mensaje": "Convenio eliminado correctamente"}
