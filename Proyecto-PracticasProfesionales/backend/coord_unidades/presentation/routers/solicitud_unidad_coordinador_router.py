from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from coord_unidades.application.use_cases.aprobar_solicitud_unidad import (
    AprobarSolicitudUnidadUseCase,
    SolicitudUnidadNoAprobableError,
    SolicitudUnidadNoEncontradaError,
)
from coord_unidades.application.use_cases.listar_solicitudes_unidad import (
    ListarSolicitudesUnidadUseCase,
)
from coord_unidades.application.use_cases.rechazar_solicitud_unidad import (
    RechazarSolicitudUnidadUseCase,
    SolicitudUnidadNoRechazableError,
    SolicitudUnidadRechazoDatosInvalidosError,
    SolicitudUnidadRechazoNoEncontradaError,
)
from coord_unidades.infrastructure.repositories.mysql_solicitud_unidad_repository import (
    MySQLSolicitudUnidadRepository,
)
from coord_unidades.presentation.schemas.solicitud_unidad_schema import (
    SolicitudUnidadListadoResponse,
    SolicitudUnidadRechazoRequest,
    SolicitudUnidadResponse,
)


router = APIRouter(
    prefix="/api/coordinador/unidades-receptoras/solicitudes",
    tags=["Coordinador Unidades - Solicitudes"],
)


@router.get(
    "/",
    response_model=list[SolicitudUnidadListadoResponse],
    status_code=status.HTTP_200_OK,
)
def listar_solicitudes_unidad(
    estado: str | None = None,
    nombre_empresa: str | None = None,
    rfc: str | None = None,
    db: Session = Depends(obtener_db),
):
    repository = MySQLSolicitudUnidadRepository(db)
    use_case = ListarSolicitudesUnidadUseCase(repository)

    try:
        return use_case.execute(
            estado=estado,
            nombre_empresa=nombre_empresa,
            rfc=rfc,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor",
        ) from exc


@router.patch(
    "/{id_solicitud}/aprobar",
    response_model=SolicitudUnidadResponse,
    status_code=status.HTTP_200_OK,
)
def aprobar_solicitud_unidad(
    id_solicitud: int,
    db: Session = Depends(obtener_db),
):
    repository = MySQLSolicitudUnidadRepository(db)
    use_case = AprobarSolicitudUnidadUseCase(repository)

    try:
        return use_case.execute(id_solicitud)
    except SolicitudUnidadNoEncontradaError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except SolicitudUnidadNoAprobableError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor",
        ) from exc


@router.patch(
    "/{id_solicitud}/rechazar",
    response_model=SolicitudUnidadResponse,
    status_code=status.HTTP_200_OK,
)
def rechazar_solicitud_unidad(
    id_solicitud: int,
    request: SolicitudUnidadRechazoRequest,
    db: Session = Depends(obtener_db),
):
    repository = MySQLSolicitudUnidadRepository(db)
    use_case = RechazarSolicitudUnidadUseCase(repository)

    try:
        return use_case.execute(id_solicitud, request.model_dump())
    except SolicitudUnidadRechazoDatosInvalidosError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(exc),
        ) from exc
    except SolicitudUnidadRechazoNoEncontradaError as exc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(exc),
        ) from exc
    except SolicitudUnidadNoRechazableError as exc:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=str(exc),
        ) from exc
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Error interno del servidor",
        ) from exc
