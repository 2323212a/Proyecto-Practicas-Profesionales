from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from schemas.documento import DocumentoCreate, DocumentoResponse
from services.documento_service import DocumentoService


router = APIRouter(
    prefix="/documentos",
    tags=["Documentos"]
)


@router.get("/", response_model=list[DocumentoResponse])
def listar_documentos(db: Session = Depends(obtener_db)):
    return DocumentoService(db).listar()


@router.get("/{id_documento}", response_model=DocumentoResponse)
def obtener_documento(
    id_documento: int,
    db: Session = Depends(obtener_db)
):
    documento = DocumentoService(db).obtener_por_id(id_documento)

    if documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    return documento


@router.post("/", response_model=DocumentoResponse)
def crear_documento(
    documento: DocumentoCreate,
    db: Session = Depends(obtener_db)
):
    return DocumentoService(db).crear(documento)


@router.patch("/{id_documento}/aprobar", response_model=DocumentoResponse)
def aprobar_documento(
    id_documento: int,
    db: Session = Depends(obtener_db)
):
    documento = DocumentoService(db).cambiar_estado_documento(
        id_documento,
        "Aprobado"
    )

    if documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    return documento


@router.patch("/{id_documento}/rechazar", response_model=DocumentoResponse)
def rechazar_documento(
    id_documento: int,
    db: Session = Depends(obtener_db)
):
    documento = DocumentoService(db).cambiar_estado_documento(
        id_documento,
        "Rechazado"
    )

    if documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    return documento


@router.patch("/{id_documento}/observar", response_model=DocumentoResponse)
def observar_documento(
    id_documento: int,
    db: Session = Depends(obtener_db)
):
    documento = DocumentoService(db).cambiar_estado_documento(
        id_documento,
        "Observado"
    )

    if documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    return documento


@router.patch("/{id_documento}/prevalidar", response_model=DocumentoResponse)
def prevalidar_documento(
    id_documento: int,
    db: Session = Depends(obtener_db)
):
    documento = DocumentoService(db).cambiar_estado_validacion_automatica(
        id_documento,
        "Prevalidado"
    )

    if documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    return documento


@router.patch("/{id_documento}/revision-manual", response_model=DocumentoResponse)
def revision_manual_documento(
    id_documento: int,
    db: Session = Depends(obtener_db)
):
    documento = DocumentoService(db).cambiar_estado_validacion_automatica(
        id_documento,
        "Revision manual"
    )

    if documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    return documento