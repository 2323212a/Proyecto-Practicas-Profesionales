from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from coord_unidades.application.use_cases.listar_empresas import (
    ListarEmpresasUseCase,
)
from coord_unidades.application.use_cases.validar_empresa import (
    ValidarEmpresaUseCase,
)
from coord_unidades.infrastructure.repositories.mysql_empresa_repository import (
    MySQLEmpresaRepository,
)
from coord_unidades.presentation.schemas.empresa_schema import (
    EmpresaResponse,
)


router = APIRouter(
    prefix="/empresas",
    tags=["Coordinador Unidades - Empresas"],
)


@router.get("/", response_model=list[EmpresaResponse])
def listar_empresas(db: Session = Depends(obtener_db)):
    repository = MySQLEmpresaRepository(db)
    use_case = ListarEmpresasUseCase(repository)

    return use_case.execute()


@router.put("/{id_empresa}/validar")
def validar_empresa(
    id_empresa: int,
    db: Session = Depends(obtener_db),
):
    repository = MySQLEmpresaRepository(db)
    use_case = ValidarEmpresaUseCase(repository)

    try:
        return use_case.execute(id_empresa)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
