from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from modules.expedientes.application.use_cases.subir_documento import (
    SubirDocumentoUseCase,
)
from modules.expedientes.infrastructure.database.connection import SessionLocal
from modules.expedientes.infrastructure.repositories.mysql_documento_repository import (
    MySQLDocumentoRepository,
)
from modules.expedientes.presentation.schemas.documento_schema import (
    DocumentoCreate,
)

router = APIRouter(
    prefix="/documentos",
    tags=["Documentos"]
)


def obtener_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get("/")
def listar_documentos(db: Session = Depends(obtener_db)):
    repository = MySQLDocumentoRepository(db)
    return repository.listar()


@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_documento(
    data: DocumentoCreate,
    db: Session = Depends(obtener_db)
):
    repository = MySQLDocumentoRepository(db)
    use_case = SubirDocumentoUseCase(repository)

    try:
        return use_case.execute(data)
    except Exception:
        db.rollback()
        raise


@router.patch("/{id_documento}/aprobar")
def aprobar_documento(
    id_documento: int,
    db: Session = Depends(obtener_db)
):
    return _cambiar_estado(id_documento, "Aprobado", db)


@router.patch("/{id_documento}/rechazar")
def rechazar_documento(
    id_documento: int,
    db: Session = Depends(obtener_db)
):
    return _cambiar_estado(id_documento, "Rechazado", db)


def _cambiar_estado(
    id_documento: int,
    estado_documento: str,
    db: Session
):
    repository = MySQLDocumentoRepository(db)
    documento_actual = repository.obtener_por_id(id_documento)

    if documento_actual is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Documento no encontrado"
        )

    if documento_actual.estado_documento != "Pendiente":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "Solo se puede aprobar o rechazar "
                "un documento pendiente"
            )
        )

    try:
        documento = repository.cambiar_estado(
            id_documento,
            estado_documento
        )
    except Exception:
        db.rollback()
        raise

    return documento
