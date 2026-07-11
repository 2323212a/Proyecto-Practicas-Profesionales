from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel
from interfaces.api.schemas.responsable_empresa import (
    ResponsableEmpresaCreate,
    ResponsableEmpresaResponse,
    ResponsableEmpresaUpdate,
)
from interfaces.api.service_factory import PerfilService


router = APIRouter(prefix="/responsables-empresa", tags=["Responsables Empresa"])


@router.get("/", response_model=list[ResponsableEmpresaResponse])
def listar_responsables(db: Session = Depends(obtener_db)):
    return db.query(ResponsableEmpresaModel).all()


@router.get("/{id_responsable}", response_model=ResponsableEmpresaResponse)
def obtener_responsable(id_responsable: int, db: Session = Depends(obtener_db)):
    responsable = db.query(ResponsableEmpresaModel).filter(
        ResponsableEmpresaModel.id_responsable == id_responsable
    ).first()
    if responsable is None:
        raise HTTPException(status_code=404, detail="Responsable no encontrado")
    return responsable


@router.post("/", response_model=ResponsableEmpresaResponse)
def crear_responsable(
    responsable: ResponsableEmpresaCreate,
    db: Session = Depends(obtener_db)
):
    PerfilService(db).validar_usuario_para_perfil(
        responsable.id_usuario,
        "Responsable Empresa"
    )
    nuevo_responsable = ResponsableEmpresaModel(**responsable.model_dump())
    db.add(nuevo_responsable)
    db.commit()
    db.refresh(nuevo_responsable)
    return nuevo_responsable


@router.put("/{id_responsable}", response_model=ResponsableEmpresaResponse)
def actualizar_responsable(
    id_responsable: int,
    datos: ResponsableEmpresaUpdate,
    db: Session = Depends(obtener_db)
):
    responsable = db.query(ResponsableEmpresaModel).filter(
        ResponsableEmpresaModel.id_responsable == id_responsable
    ).first()
    if responsable is None:
        raise HTTPException(status_code=404, detail="Responsable no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(responsable, campo, valor)

    db.commit()
    db.refresh(responsable)
    return responsable


@router.delete("/{id_responsable}")
def eliminar_responsable(id_responsable: int, db: Session = Depends(obtener_db)):
    responsable = db.query(ResponsableEmpresaModel).filter(
        ResponsableEmpresaModel.id_responsable == id_responsable
    ).first()
    if responsable is None:
        raise HTTPException(status_code=404, detail="Responsable no encontrado")

    db.delete(responsable)
    db.commit()
    return {"mensaje": "Responsable eliminado correctamente"}
