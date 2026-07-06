from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from coord_unidades.application.use_cases.listar_padron_empresarial import (
    ListarPadronEmpresarialUseCase,
)
from coord_unidades.infrastructure.repositories.mysql_padron_empresarial_repository import (
    MySQLPadronEmpresarialRepository,
)
from coord_unidades.presentation.schemas.padron_empresarial_schema import (
    PadronEmpresarialResponse,
)


router = APIRouter(
    prefix="/padron-empresarial",
    tags=["Coordinador Unidades - Padron Empresarial"],
)


@router.get("/", response_model=list[PadronEmpresarialResponse])
def listar_padron_empresarial(db: Session = Depends(obtener_db)):
    repository = MySQLPadronEmpresarialRepository(db)
    use_case = ListarPadronEmpresarialUseCase(repository)

    return use_case.execute()
