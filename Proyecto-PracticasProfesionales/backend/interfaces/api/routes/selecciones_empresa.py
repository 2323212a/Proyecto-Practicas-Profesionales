from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.seleccion_empresa import SeleccionEmpresaModel
from interfaces.api.schemas.seleccion_empresa import (
    SeleccionEmpresaCreate,
    SeleccionEmpresaResponse,
    SeleccionEmpresaUpdate,
)


router = APIRouter(prefix="/selecciones-empresa", tags=["Selecciones Empresa"])


@router.get("/", response_model=list[SeleccionEmpresaResponse])
def listar_selecciones(db: Session = Depends(obtener_db)):
    return db.query(SeleccionEmpresaModel).all()


@router.get("/{id_seleccion}", response_model=SeleccionEmpresaResponse)
def obtener_seleccion(id_seleccion: int, db: Session = Depends(obtener_db)):
    seleccion = db.query(SeleccionEmpresaModel).filter(
        SeleccionEmpresaModel.id_seleccion == id_seleccion
    ).first()
    if seleccion is None:
        raise HTTPException(status_code=404, detail="Selección no encontrada")
    return seleccion


@router.post("/", response_model=SeleccionEmpresaResponse)
def crear_seleccion(seleccion: SeleccionEmpresaCreate, db: Session = Depends(obtener_db)):
    nueva_seleccion = SeleccionEmpresaModel(**seleccion.model_dump())
    db.add(nueva_seleccion)
    db.commit()
    db.refresh(nueva_seleccion)
    return nueva_seleccion


@router.put("/{id_seleccion}", response_model=SeleccionEmpresaResponse)
def actualizar_seleccion(
    id_seleccion: int,
    datos: SeleccionEmpresaUpdate,
    db: Session = Depends(obtener_db)
):
    seleccion = db.query(SeleccionEmpresaModel).filter(
        SeleccionEmpresaModel.id_seleccion == id_seleccion
    ).first()
    if seleccion is None:
        raise HTTPException(status_code=404, detail="Selección no encontrada")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(seleccion, campo, valor)

    db.commit()
    db.refresh(seleccion)
    return seleccion


@router.delete("/{id_seleccion}")
def eliminar_seleccion(id_seleccion: int, db: Session = Depends(obtener_db)):
    seleccion = db.query(SeleccionEmpresaModel).filter(
        SeleccionEmpresaModel.id_seleccion == id_seleccion
    ).first()
    if seleccion is None:
        raise HTTPException(status_code=404, detail="Selección no encontrada")

    db.delete(seleccion)
    db.commit()
    return {"mensaje": "Selección eliminada correctamente"}
