from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from schemas.empresa import EmpresaCreate, EmpresaResponse, EmpresaUpdate
from database.dependencies import obtener_db
from services.empresa_service import EmpresaService


router = APIRouter(
    prefix="/empresas",
    tags=["Empresas"]
)


@router.get(
    "/",
    response_model=list[EmpresaResponse]
)
def listar_empresas(
    db: Session = Depends(obtener_db)
):
    return EmpresaService(db).listar()


@router.get(
    "/{id_empresa}",
    response_model=EmpresaResponse
)
def obtener_empresa(
    id_empresa: int,
    db: Session = Depends(obtener_db)
):
    empresa = EmpresaService(db).obtener_por_id(id_empresa)

    if empresa is None:
        raise HTTPException(
            status_code=404,
            detail="Empresa no encontrada"
        )

    return empresa


@router.post(
    "/",
    response_model=EmpresaResponse
)
def crear_empresa(
    empresa: EmpresaCreate,
    db: Session = Depends(obtener_db)
):
    return EmpresaService(db).crear(empresa)


@router.put(
    "/{id_empresa}",
    response_model=EmpresaResponse
)
def actualizar_empresa(
    id_empresa: int,
    empresa: EmpresaUpdate,
    db: Session = Depends(obtener_db)
):
    empresa_actualizada = EmpresaService(db).actualizar(
        id_empresa,
        empresa
    )

    if empresa_actualizada is None:
        raise HTTPException(
            status_code=404,
            detail="Empresa no encontrada"
        )

    return empresa_actualizada


@router.delete("/{id_empresa}")
def eliminar_empresa(
    id_empresa: int,
    db: Session = Depends(obtener_db)
):
    empresa = EmpresaService(db).eliminar(id_empresa)

    if empresa is None:
        raise HTTPException(
            status_code=404,
            detail="Empresa no encontrada"
        )

    return {"mensaje": "Empresa eliminada correctamente"}