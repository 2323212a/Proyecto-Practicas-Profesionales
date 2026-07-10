from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from coord_unidades.application.use_cases.enviar_notificacion import (
    EnviarNotificacionUseCase,
)
from coord_unidades.application.use_cases.listar_notificaciones import (
    ListarNotificacionesUseCase,
)
from coord_unidades.infrastructure.repositories.mysql_notificacion_repository import (
    MySQLNotificacionRepository,
)
from coord_unidades.presentation.schemas.notificacion_schema import (
    NotificacionCreate,
    NotificacionResponse,
)


router = APIRouter(
    prefix="/notificaciones",
    tags=["Coordinador Unidades - Notificaciones"],
)


@router.get("/", response_model=list[NotificacionResponse])
def listar_notificaciones(db: Session = Depends(obtener_db)):
    repository = MySQLNotificacionRepository(db)
    use_case = ListarNotificacionesUseCase(repository)

    return use_case.execute()


@router.post("/", response_model=NotificacionResponse)
def enviar_notificacion(
    data: NotificacionCreate,
    db: Session = Depends(obtener_db),
):
    repository = MySQLNotificacionRepository(db)
    use_case = EnviarNotificacionUseCase(repository)

    return use_case.execute(data)
