from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from coord_unidades.application.use_cases.registrar_solicitud_unidad import (
    DatosSolicitudUnidadInvalidosError,
    RegistrarSolicitudUnidadUseCase,
    SolicitudUnidadConflictError,
)
from coord_unidades.infrastructure.repositories.mysql_solicitud_unidad_repository import (
    MySQLSolicitudUnidadRepository,
)
from coord_unidades.presentation.schemas.solicitud_unidad_schema import (
    SolicitudUnidadRequest,
    SolicitudUnidadResponse,
)


router = APIRouter(
    prefix="/api/public/unidades-receptoras",
    tags=["Publico - Unidades Receptoras"],
)


@router.post(
    "/solicitud",
    response_model=SolicitudUnidadResponse,
    status_code=status.HTTP_201_CREATED,
)
def registrar_solicitud_unidad(
    request: SolicitudUnidadRequest,
    db: Session = Depends(obtener_db),
):
    repository = MySQLSolicitudUnidadRepository(db)
    use_case = RegistrarSolicitudUnidadUseCase(repository)

    try:
        return use_case.execute(request.model_dump())
    except DatosSolicitudUnidadInvalidosError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except SolicitudUnidadConflictError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor",
        ) from exc
