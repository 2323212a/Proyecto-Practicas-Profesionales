from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from interfaces.api.schemas.alumno import AlumnoCreate, AlumnoResponse, AlumnoUpdate
from interfaces.api.service_factory import AlumnoService


router = APIRouter(
    prefix="/alumnos",
    tags=["Alumnos"]
)


@router.get("/", response_model=list[AlumnoResponse])
def listar_alumnos(db: Session = Depends(obtener_db)):
    return AlumnoService(db).listar()


@router.get("/{id_alumno}", response_model=AlumnoResponse)
def obtener_alumno(
    id_alumno: int,
    db: Session = Depends(obtener_db)
):
    alumno = AlumnoService(db).obtener_por_id(id_alumno)

    if alumno is None:
        raise HTTPException(
            status_code=404,
            detail="Alumno no encontrado"
        )

    return alumno


@router.post("/", response_model=AlumnoResponse)
def crear_alumno(
    alumno: AlumnoCreate,
    db: Session = Depends(obtener_db)
):
    return AlumnoService(db).crear(alumno)


@router.put("/{id_alumno}", response_model=AlumnoResponse)
def actualizar_alumno(
    id_alumno: int,
    datos: AlumnoUpdate,
    db: Session = Depends(obtener_db)
):
    alumno = AlumnoService(db).actualizar(id_alumno, datos)

    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    return alumno


@router.delete("/{id_alumno}")
def eliminar_alumno(
    id_alumno: int,
    db: Session = Depends(obtener_db)
):
    alumno = AlumnoService(db).eliminar(id_alumno)

    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    return {"mensaje": "Alumno eliminado correctamente"}
