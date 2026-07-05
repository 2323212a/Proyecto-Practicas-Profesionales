from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from coord_unidades.application.use_cases.crear_convenio import (
    CrearConvenioUseCase,
)
from coord_unidades.application.use_cases.listar_convenios import (
    ListarConveniosUseCase,
)
from coord_unidades.application.use_cases.actualizar_convenio import (
    ActualizarConvenioUseCase,
)
from coord_unidades.infrastructure.repositories.mysql_convenio_repository import (
    MySQLConvenioRepository,
)
from coord_unidades.presentation.schemas.convenio_schema import (
    ConvenioCreate,
)


router = APIRouter(
    prefix="/convenios",
    tags=["Coordinador Unidades - Convenios"],
)


@router.get("/")
def listar_convenios(db: Session = Depends(obtener_db)):
    repository = MySQLConvenioRepository(db)
    use_case = ListarConveniosUseCase(repository)

    return use_case.execute()


@router.post("/")
def crear_convenio(
    data: ConvenioCreate,
    db: Session = Depends(obtener_db),
):
    repository = MySQLConvenioRepository(db)
    use_case = CrearConvenioUseCase(repository)

    return use_case.execute(data)


@router.put("/{id_convenio}")
def actualizar_convenio(
    id_convenio: int,
    data: ConvenioCreate,
    db: Session = Depends(obtener_db),
):
    repository = MySQLConvenioRepository(db)
    use_case = ActualizarConvenioUseCase(repository)

    return use_case.execute(id_convenio, data)
