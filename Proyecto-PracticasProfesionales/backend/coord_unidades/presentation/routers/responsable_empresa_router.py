from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from coord_unidades.application.use_cases.crear_responsable_empresa import (
    CrearResponsableEmpresaUseCase,
)
from coord_unidades.application.use_cases.listar_responsables_empresa import (
    ListarResponsablesEmpresaUseCase,
)
from coord_unidades.infrastructure.repositories.mysql_responsable_empresa_repository import (
    MySQLResponsableEmpresaRepository,
)
from coord_unidades.presentation.schemas.responsable_empresa_schema import (
    ResponsableEmpresaCreate,
)


router = APIRouter(
    prefix="/responsables",
    tags=["Coordinador Unidades - Responsables"],
)


@router.get("/empresa/{id_empresa}")
def listar_responsables(
    id_empresa: int,
    db: Session = Depends(obtener_db),
):
    repository = MySQLResponsableEmpresaRepository(db)
    use_case = ListarResponsablesEmpresaUseCase(repository)

    return use_case.execute(id_empresa)


@router.post("/")
def crear_responsable(
    data: ResponsableEmpresaCreate,
    db: Session = Depends(obtener_db),
):
    repository = MySQLResponsableEmpresaRepository(db)
    use_case = CrearResponsableEmpresaUseCase(repository)

    return use_case.execute(data)
