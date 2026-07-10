from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from coord_unidades.application.use_cases.aprobar_vacante import (
    AprobarVacanteUseCase,
)
from coord_unidades.application.use_cases.listar_vacantes import (
    ListarVacantesUseCase,
)
from coord_unidades.infrastructure.repositories.mysql_vacante_repository import (
    MySQLVacanteRepository,
)
from coord_unidades.presentation.schemas.vacante_schema import (
    VacanteResponse,
)


router = APIRouter(
    prefix="/vacantes",
    tags=["Coordinador Unidades - Vacantes"],
)


@router.get("/", response_model=list[VacanteResponse])
def listar_vacantes(db: Session = Depends(obtener_db)):
    repository = MySQLVacanteRepository(db)
    use_case = ListarVacantesUseCase(repository)

    return use_case.execute()


@router.put("/{id_vacante}/aprobar", response_model=VacanteResponse)
def aprobar_vacante(
    id_vacante: int,
    db: Session = Depends(obtener_db),
):
    repository = MySQLVacanteRepository(db)
    use_case = AprobarVacanteUseCase(repository)

    try:
        return use_case.execute(id_vacante)
    except Exception as exc:
        raise HTTPException(
            status_code=400,
            detail=str(exc),
        ) from exc
