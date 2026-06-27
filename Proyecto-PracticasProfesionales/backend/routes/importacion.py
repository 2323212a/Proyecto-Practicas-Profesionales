import pandas as pd

from fastapi import APIRouter, UploadFile, File, Depends
from sqlalchemy.orm import Session
import secrets
import string

from fastapi import HTTPException

from security.password import generar_password_hash
from database.dependencies import obtener_db
from models.usuario import UsuarioModel
from models.alumno import AlumnoModel
from models.carrera import CarreraModel


router = APIRouter(
    prefix="/importacion",
    tags=["Importación"]
)


COLUMNAS_REQUERIDAS = [
    "matricula",
    "nombre",
    "apellido_paterno",
    "apellido_materno",
    "correo",
    "carrera",
    "semestre",
    "grupo",
    "creditos_aprobados"
]

def generar_password_segura(longitud: int = 12):
    caracteres = (
        string.ascii_letters +
        string.digits +
        "!@#$%&*"
    )

    return "".join(
        secrets.choice(caracteres)
        for _ in range(longitud)
    )

@router.post("/validar-alumnos")
async def validar_alumnos(
    archivo: UploadFile = File(...),
    db: Session = Depends(obtener_db)
):
    df = pd.read_excel(archivo.file)

    errores = []

    for columna in COLUMNAS_REQUERIDAS:
        if columna not in df.columns:
            errores.append({
                "fila": 0,
                "error": f"Falta la columna {columna}"
            })

    if errores:
        return {
            "total": 0,
            "validos": 0,
            "errores": errores
        }

    for index, fila in df.iterrows():
        numero_fila = index + 2

        correo = str(fila["correo"]).strip()
        matricula = str(fila["matricula"]).strip()
        carrera_nombre = str(fila["carrera"]).strip()

        if not correo:
            errores.append({"fila": numero_fila, "error": "Correo vacío"})

        if not matricula:
            errores.append({"fila": numero_fila, "error": "Matrícula vacía"})

        usuario_existente = (
            db.query(UsuarioModel)
            .filter(UsuarioModel.correo == correo)
            .first()
        )

        if usuario_existente:
            errores.append({
                "fila": numero_fila,
                "error": f"Correo ya registrado: {correo}"
            })

        alumno_existente = (
            db.query(AlumnoModel)
            .filter(AlumnoModel.matricula == matricula)
            .first()
        )

        if alumno_existente:
            errores.append({
                "fila": numero_fila,
                "error": f"Matrícula ya registrada: {matricula}"
            })

        carrera = (
            db.query(CarreraModel)
            .filter(CarreraModel.nombre == carrera_nombre)
            .first()
        )

        if carrera is None:
            errores.append({
                "fila": numero_fila,
                "error": f"Carrera no existe: {carrera_nombre}"
            })

    total = len(df)
    validos = total - len(set(e["fila"] for e in errores if e["fila"] != 0))

    return {
        "total": total,
        "validos": validos,
        "errores": errores
    }

@router.post("/importar-alumnos")
async def importar_alumnos(
    archivo: UploadFile = File(...),
    db: Session = Depends(obtener_db)
):
    df = pd.read_excel(archivo.file)

    importados = []
    errores = []

    for index, fila in df.iterrows():
        numero_fila = index + 2

        matricula = str(fila["matricula"]).strip()
        nombre = str(fila["nombre"]).strip()
        apellido_paterno = str(fila["apellido_paterno"]).strip()
        apellido_materno = str(fila["apellido_materno"]).strip()
        correo = str(fila["correo"]).strip()
        carrera_nombre = str(fila["carrera"]).strip()
        semestre = int(fila["semestre"])
        grupo = str(fila["grupo"]).strip()
        creditos_aprobados = int(fila["creditos_aprobados"])

        usuario_existente = (
            db.query(UsuarioModel)
            .filter(UsuarioModel.correo == correo)
            .first()
        )

        if usuario_existente:
            errores.append({
                "fila": numero_fila,
                "error": f"Correo ya registrado: {correo}"
            })
            continue

        alumno_existente = (
            db.query(AlumnoModel)
            .filter(AlumnoModel.matricula == matricula)
            .first()
        )

        if alumno_existente:
            errores.append({
                "fila": numero_fila,
                "error": f"Matrícula ya registrada: {matricula}"
            })
            continue

        carrera = (
            db.query(CarreraModel)
            .filter(CarreraModel.nombre == carrera_nombre)
            .first()
        )

        if carrera is None:
            errores.append({
                "fila": numero_fila,
                "error": f"Carrera no existe: {carrera_nombre}"
            })
            continue

        password_generada = generar_password_segura()

        nuevo_usuario = UsuarioModel(
            id_rol=1,
            nombre=nombre,
            apellido_paterno=apellido_paterno,
            apellido_materno=apellido_materno,
            correo=correo,
            password=generar_password_hash(password_generada),
            estado="Activo"
        )

        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)

        nuevo_alumno = AlumnoModel(
            id_usuario=nuevo_usuario.id_usuario,
            id_carrera=carrera.id_carrera,
            matricula=matricula,
            semestre=semestre,
            grupo=grupo,
            creditos_aprobados=creditos_aprobados,
            estado_alumno="Activo"
        )

        db.add(nuevo_alumno)
        db.commit()
        db.refresh(nuevo_alumno)

        importados.append({
            "fila": numero_fila,
            "id_usuario": nuevo_usuario.id_usuario,
            "id_alumno": nuevo_alumno.id_alumno,
            "matricula": matricula,
            "correo": correo,
            "password_temporal": password_generada
        })

    return {
        "total": len(df),
        "importados": len(importados),
        "errores": errores,
        "alumnos": importados
    }