from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from database.connection import SessionLocal
from schemas.documento import DocumentoCreate, DocumentoResponse
from services.documento_service import DocumentoService

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


@router.get("/", response_model=list[DocumentoResponse])
def listar_documentos(db: Session = Depends(obtener_db)):
    service = DocumentoService(db)
    return service.listar()


@router.post(
    "/",
    response_model=DocumentoResponse,
    status_code=status.HTTP_201_CREATED
)
def crear_documento(
    documento: DocumentoCreate,
    db: Session = Depends(obtener_db)
):
    service = DocumentoService(db)
    return service.crear(documento)


@router.patch("/{id_documento}/aprobar", response_model=DocumentoResponse)
def aprobar_documento(
    id_documento: int,
    db: Session = Depends(obtener_db)
):
    return cambiar_estado_documento(id_documento, "Aprobado", db)


@router.patch("/{id_documento}/rechazar", response_model=DocumentoResponse)
def rechazar_documento(
    id_documento: int,
    db: Session = Depends(obtener_db)
):
    return cambiar_estado_documento(id_documento, "Rechazado", db)


def cambiar_estado_documento(
    id_documento: int,
    estado: str,
    db: Session
):
    service = DocumentoService(db)

    documento_actual = service.obtener_por_id(id_documento)

    if documento_actual is None:
        raise HTTPException(
            status_code=404,
            detail="Documento no encontrado"
        )

    if documento_actual.estado_documento != "Pendiente":
        raise HTTPException(
            status_code=409,
            detail="Solo se puede aprobar o rechazar un documento pendiente"
        )

    return service.cambiar_estado(id_documento, estado)