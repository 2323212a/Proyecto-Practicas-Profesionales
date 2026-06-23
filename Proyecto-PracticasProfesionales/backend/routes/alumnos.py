from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from schemas.alumno import AlumnoCreate, AlumnoResponse
from services.alumno_service import AlumnoService


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