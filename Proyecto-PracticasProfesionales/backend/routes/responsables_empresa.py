from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from schemas.responsable_empresa import (
    ResponsableEmpresaCreate,
    ResponsableEmpresaUpdate,
    ResponsableEmpresaResponse,
)
from services.responsable_empresa_service import ResponsableEmpresaService


router = APIRouter(
    prefix="/responsables-empresa",
    tags=["Responsables Empresa"]
)


@router.get("/", response_model=list[ResponsableEmpresaResponse])
def listar_responsables(db: Session = Depends(obtener_db)):
    return ResponsableEmpresaService(db).listar()


@router.get("/empresa/{id_empresa}", response_model=list[ResponsableEmpresaResponse])
def listar_responsables_por_empresa(
    id_empresa: int,
    db: Session = Depends(obtener_db)
):
    return ResponsableEmpresaService(db).listar_por_empresa(id_empresa)


@router.get("/{id_responsable}", response_model=ResponsableEmpresaResponse)
def obtener_responsable(
    id_responsable: int,
    db: Session = Depends(obtener_db)
):
    responsable = ResponsableEmpresaService(db).obtener(id_responsable)

    if responsable is None:
        raise HTTPException(status_code=404, detail="Responsable no encontrado")

    return responsable


@router.post("/", response_model=ResponsableEmpresaResponse)
def crear_responsable(
    responsable: ResponsableEmpresaCreate,
    db: Session = Depends(obtener_db)
):
    return ResponsableEmpresaService(db).crear(responsable)


@router.put("/{id_responsable}", response_model=ResponsableEmpresaResponse)
def actualizar_responsable(
    id_responsable: int,
    responsable: ResponsableEmpresaUpdate,
    db: Session = Depends(obtener_db)
):
    responsable_actualizado = ResponsableEmpresaService(db).actualizar(
        id_responsable,
        responsable
    )

    if responsable_actualizado is None:
        raise HTTPException(status_code=404, detail="Responsable no encontrado")

    return responsable_actualizado


@router.delete("/{id_responsable}")
def eliminar_responsable(
    id_responsable: int,
    db: Session = Depends(obtener_db)
):
    responsable = ResponsableEmpresaService(db).eliminar(id_responsable)

    if responsable is None:
        raise HTTPException(status_code=404, detail="Responsable no encontrado")

    return {"mensaje": "Responsable eliminado correctamente"}