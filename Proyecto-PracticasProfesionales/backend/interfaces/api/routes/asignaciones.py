from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.docente_asesor import DocenteAsesorModel
from infrastructure.persistence.models.notificacion import NotificacionModel
from interfaces.api.schemas.asignacion import (
    AsignacionCreate,
    AsignacionResponse,
    AsignacionUpdate,
    AsignarDocenteRequest,
)
from interfaces.api.service_factory import AsignacionService


router = APIRouter(prefix="/asignaciones", tags=["Asignaciones"])


@router.get("/", response_model=list[AsignacionResponse])
def listar_asignaciones(db: Session = Depends(obtener_db)):
    return AsignacionService(db).listar()


@router.get("/{id_asignacion}", response_model=AsignacionResponse)
def obtener_asignacion(id_asignacion: int, db: Session = Depends(obtener_db)):
    asignacion = AsignacionService(db).obtener_por_id(id_asignacion)
    if asignacion is None:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return asignacion


@router.post("/", response_model=AsignacionResponse)
def crear_asignacion(asignacion: AsignacionCreate, db: Session = Depends(obtener_db)):
    return AsignacionService(db).crear(asignacion)


@router.put("/{id_asignacion}", response_model=AsignacionResponse)
def actualizar_asignacion(
    id_asignacion: int,
    datos: AsignacionUpdate,
    db: Session = Depends(obtener_db)
):
    asignacion = AsignacionService(db).actualizar(id_asignacion, datos)
    if asignacion is None:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return asignacion


@router.patch("/{id_asignacion}/docente", response_model=AsignacionResponse)
def asignar_docente(
    id_asignacion: int,
    datos: AsignarDocenteRequest,
    db: Session = Depends(obtener_db)
):
    asignacion = AsignacionService(db).actualizar(
        id_asignacion,
        AsignacionUpdate(id_docente=datos.id_docente),
    )
    if asignacion is None:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")

    docente = db.query(DocenteAsesorModel).filter(
        DocenteAsesorModel.id_docente == datos.id_docente
    ).first()
    if docente is not None:
        db.add(NotificacionModel(
            id_usuario=docente.id_usuario,
            titulo="Nuevo alumno asignado",
            mensaje=(
                "Se te asignó un nuevo alumno para seguimiento académico. "
                "Puedes revisarlo en el módulo de Alumnos Asignados."
            ),
        ))
        db.commit()
        db.refresh(asignacion)

    return asignacion


@router.patch("/{id_asignacion}/finalizar", response_model=AsignacionResponse)
def finalizar_asignacion(id_asignacion: int, db: Session = Depends(obtener_db)):
    asignacion = AsignacionService(db).finalizar(id_asignacion)
    if asignacion is None:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return asignacion


@router.patch("/{id_asignacion}/cancelar", response_model=AsignacionResponse)
def cancelar_asignacion(id_asignacion: int, db: Session = Depends(obtener_db)):
    asignacion = AsignacionService(db).cancelar(id_asignacion)
    if asignacion is None:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return asignacion


@router.delete("/{id_asignacion}")
def eliminar_asignacion(id_asignacion: int, db: Session = Depends(obtener_db)):
    asignacion = AsignacionService(db).eliminar(id_asignacion)
    if asignacion is None:
        raise HTTPException(status_code=404, detail="Asignación no encontrada")
    return {"mensaje": "Asignación eliminada correctamente"}
