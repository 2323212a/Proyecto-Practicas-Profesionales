from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.reporte import ReporteModel
from interfaces.api.schemas.reporte import ReporteCreate, ReporteResponse, ReporteUpdate


router = APIRouter(prefix="/reportes", tags=["Reportes"])


@router.get("/", response_model=list[ReporteResponse])
def listar_reportes(db: Session = Depends(obtener_db)):
    return db.query(ReporteModel).all()


@router.get("/{id_reporte}", response_model=ReporteResponse)
def obtener_reporte(id_reporte: int, db: Session = Depends(obtener_db)):
    reporte = db.query(ReporteModel).filter(ReporteModel.id_reporte == id_reporte).first()
    if reporte is None:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")
    return reporte


@router.post("/", response_model=ReporteResponse)
def crear_reporte(reporte: ReporteCreate, db: Session = Depends(obtener_db)):
    nuevo_reporte = ReporteModel(**reporte.model_dump())
    db.add(nuevo_reporte)
    db.commit()
    db.refresh(nuevo_reporte)
    return nuevo_reporte


@router.put("/{id_reporte}", response_model=ReporteResponse)
def actualizar_reporte(
    id_reporte: int,
    datos: ReporteUpdate,
    db: Session = Depends(obtener_db)
):
    reporte = db.query(ReporteModel).filter(ReporteModel.id_reporte == id_reporte).first()
    if reporte is None:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(reporte, campo, valor)

    db.commit()
    db.refresh(reporte)
    return reporte


@router.patch("/{id_reporte}/aprobar", response_model=ReporteResponse)
def aprobar_reporte(id_reporte: int, db: Session = Depends(obtener_db)):
    reporte = db.query(ReporteModel).filter(ReporteModel.id_reporte == id_reporte).first()
    if reporte is None:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    reporte.estado_reporte = "Aprobado"
    db.commit()
    db.refresh(reporte)
    return reporte


@router.patch("/{id_reporte}/rechazar", response_model=ReporteResponse)
def rechazar_reporte(id_reporte: int, db: Session = Depends(obtener_db)):
    reporte = db.query(ReporteModel).filter(ReporteModel.id_reporte == id_reporte).first()
    if reporte is None:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    reporte.estado_reporte = "Rechazado"
    db.commit()
    db.refresh(reporte)
    return reporte


@router.delete("/{id_reporte}")
def eliminar_reporte(id_reporte: int, db: Session = Depends(obtener_db)):
    reporte = db.query(ReporteModel).filter(ReporteModel.id_reporte == id_reporte).first()
    if reporte is None:
        raise HTTPException(status_code=404, detail="Reporte no encontrado")

    db.delete(reporte)
    db.commit()
    return {"mensaje": "Reporte eliminado correctamente"}
