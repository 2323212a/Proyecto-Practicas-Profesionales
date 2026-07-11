from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.bitacora_auditoria import BitacoraAuditoriaModel
from interfaces.api.schemas.bitacora_auditoria import BitacoraAuditoriaCreate, BitacoraAuditoriaResponse


router = APIRouter(prefix="/bitacora", tags=["Bitácora Auditoría"])


@router.get("/", response_model=list[BitacoraAuditoriaResponse])
def listar_bitacora(db: Session = Depends(obtener_db)):
    return db.query(BitacoraAuditoriaModel).order_by(
        BitacoraAuditoriaModel.fecha_accion.desc()
    ).all()


@router.get("/usuario/{id_usuario}", response_model=list[BitacoraAuditoriaResponse])
def listar_bitacora_usuario(id_usuario: int, db: Session = Depends(obtener_db)):
    return db.query(BitacoraAuditoriaModel).filter(
        BitacoraAuditoriaModel.id_usuario == id_usuario
    ).order_by(BitacoraAuditoriaModel.fecha_accion.desc()).all()


@router.get("/{id_bitacora}", response_model=BitacoraAuditoriaResponse)
def obtener_bitacora(id_bitacora: int, db: Session = Depends(obtener_db)):
    bitacora = db.query(BitacoraAuditoriaModel).filter(
        BitacoraAuditoriaModel.id_bitacora == id_bitacora
    ).first()
    if bitacora is None:
        raise HTTPException(status_code=404, detail="Registro de bitácora no encontrado")
    return bitacora


@router.post("/", response_model=BitacoraAuditoriaResponse)
def crear_bitacora(registro: BitacoraAuditoriaCreate, db: Session = Depends(obtener_db)):
    nuevo_registro = BitacoraAuditoriaModel(**registro.model_dump())
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    return nuevo_registro
