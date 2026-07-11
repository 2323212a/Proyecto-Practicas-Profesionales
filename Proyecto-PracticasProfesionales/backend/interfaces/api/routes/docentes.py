from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.docente_asesor import DocenteAsesorModel
from interfaces.api.schemas.docente_asesor import DocenteAsesorCreate, DocenteAsesorResponse, DocenteAsesorUpdate
from interfaces.api.service_factory import PerfilService


router = APIRouter(prefix="/docentes", tags=["Docentes"])


@router.get("/", response_model=list[DocenteAsesorResponse])
def listar_docentes(db: Session = Depends(obtener_db)):
    return db.query(DocenteAsesorModel).all()


@router.get("/{id_docente}", response_model=DocenteAsesorResponse)
def obtener_docente(id_docente: int, db: Session = Depends(obtener_db)):
    docente = db.query(DocenteAsesorModel).filter(
        DocenteAsesorModel.id_docente == id_docente
    ).first()
    if docente is None:
        raise HTTPException(status_code=404, detail="Docente no encontrado")
    return docente


@router.post("/", response_model=DocenteAsesorResponse)
def crear_docente(docente: DocenteAsesorCreate, db: Session = Depends(obtener_db)):
    PerfilService(db).validar_usuario_para_perfil(docente.id_usuario, "Docente")
    nuevo_docente = DocenteAsesorModel(**docente.model_dump())
    db.add(nuevo_docente)
    db.commit()
    db.refresh(nuevo_docente)
    return nuevo_docente


@router.put("/{id_docente}", response_model=DocenteAsesorResponse)
def actualizar_docente(
    id_docente: int,
    datos: DocenteAsesorUpdate,
    db: Session = Depends(obtener_db)
):
    docente = db.query(DocenteAsesorModel).filter(
        DocenteAsesorModel.id_docente == id_docente
    ).first()
    if docente is None:
        raise HTTPException(status_code=404, detail="Docente no encontrado")

    for campo, valor in datos.model_dump(exclude_unset=True).items():
        setattr(docente, campo, valor)

    db.commit()
    db.refresh(docente)
    return docente


@router.delete("/{id_docente}")
def eliminar_docente(id_docente: int, db: Session = Depends(obtener_db)):
    docente = db.query(DocenteAsesorModel).filter(
        DocenteAsesorModel.id_docente == id_docente
    ).first()
    if docente is None:
        raise HTTPException(status_code=404, detail="Docente no encontrado")

    db.delete(docente)
    db.commit()
    return {"mensaje": "Docente eliminado correctamente"}
