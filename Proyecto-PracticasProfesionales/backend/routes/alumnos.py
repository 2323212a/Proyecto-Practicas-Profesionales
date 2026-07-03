from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from models.alumno import AlumnoModel
from models.carrera import CarreraModel
from models.usuario import UsuarioModel
from schemas.alumno import AlumnoCreate, AlumnoPerfilResponse, AlumnoResponse
from security.jwt import ALGORITHM, SECRET_KEY
from services.alumno_service import AlumnoService


router = APIRouter(
    prefix="/alumnos",
    tags=["Alumnos"]
)

security = HTTPBearer()


def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(obtener_db)
):
    try:
        payload = jwt.decode(
            credenciales.credentials,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )
        id_usuario = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Token invalido")

    usuario = db.query(UsuarioModel).filter(
        UsuarioModel.id_usuario == id_usuario
    ).first()

    if usuario is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return usuario


@router.get("/", response_model=list[AlumnoResponse])
def listar_alumnos(db: Session = Depends(obtener_db)):
    return AlumnoService(db).listar()


@router.get("/me/perfil", response_model=AlumnoPerfilResponse)
def obtener_mi_perfil(
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual)
):
    alumno = db.query(AlumnoModel).filter(
        AlumnoModel.id_usuario == usuario_actual.id_usuario
    ).first()

    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    carrera = db.query(CarreraModel).filter(
        CarreraModel.id_carrera == alumno.id_carrera
    ).first()

    return {
        "id_usuario": usuario_actual.id_usuario,
        "id_alumno": alumno.id_alumno,
        "id_rol": usuario_actual.id_rol,
        "nombre": usuario_actual.nombre,
        "apellido_paterno": usuario_actual.apellido_paterno,
        "apellido_materno": usuario_actual.apellido_materno,
        "correo": usuario_actual.correo,
        "estado_usuario": usuario_actual.estado,
        "fecha_registro": usuario_actual.fecha_registro,
        "matricula": alumno.matricula,
        "semestre": alumno.semestre,
        "grupo": alumno.grupo,
        "creditos_aprobados": alumno.creditos_aprobados,
        "estado_alumno": alumno.estado_alumno,
        "id_carrera": alumno.id_carrera,
        "carrera_clave": carrera.clave if carrera else None,
        "carrera_nombre": carrera.nombre if carrera else None,
    }


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