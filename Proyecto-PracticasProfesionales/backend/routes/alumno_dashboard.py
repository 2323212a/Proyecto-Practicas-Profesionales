from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from jose import jwt, JWTError

from database.dependencies import obtener_db
from security.jwt import SECRET_KEY, ALGORITHM

from models.usuario import UsuarioModel
from models.alumno import AlumnoModel
from models.expediente import ExpedienteModel
from models.documento import DocumentoModel


router = APIRouter(
    prefix="/alumno",
    tags=["Alumno Dashboard"]
)

security = HTTPBearer()


def obtener_usuario_actual(
    credenciales: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(obtener_db)
):
    try:
        token = credenciales.credentials
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        id_usuario = int(payload.get("sub"))
    except JWTError:
        raise HTTPException(status_code=401, detail="Token inválido")

    usuario = db.query(UsuarioModel).filter(
        UsuarioModel.id_usuario == id_usuario
    ).first()

    if usuario is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")

    return usuario


@router.get("/dashboard")
def obtener_dashboard_alumno(
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual)
):
    alumno = db.query(AlumnoModel).filter(
        AlumnoModel.id_usuario == usuario_actual.id_usuario
    ).first()

    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    expediente = db.query(ExpedienteModel).filter(
        ExpedienteModel.id_alumno == alumno.id_alumno
    ).first()

    if expediente is None:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")

    documentos = db.query(DocumentoModel).filter(
        DocumentoModel.id_expediente == expediente.id_expediente
    ).all()

    total_documentos = len(documentos)

    aprobados = sum(
        1 for doc in documentos
        if doc.estado_documento == "Aprobado"
    )

    pendientes = sum(
        1 for doc in documentos
        if doc.estado_documento == "Pendiente"
    )

    en_revision = sum(
        1 for doc in documentos
        if doc.estado_documento in ["En Revision", "Observado", "Rechazado"]
    )

    horas_acumuladas = 0
    horas_totales = 480
    porcentaje = round((horas_acumuladas / horas_totales) * 100, 1)

    nombre_completo = f"{usuario_actual.nombre} {usuario_actual.apellido_paterno or ''} {usuario_actual.apellido_materno or ''}".strip()

    return {
        "alumno": {
            "id_alumno": alumno.id_alumno,
            "id_usuario": usuario_actual.id_usuario,
            "nombre": usuario_actual.nombre,
            "nombre_completo": nombre_completo,
            "correo": usuario_actual.correo,
            "matricula": alumno.matricula,
            "semestre": alumno.semestre,
            "grupo": alumno.grupo,
            "estado_alumno": alumno.estado_alumno
        },
        "proceso": {
            "estado_general": expediente.estado_expediente,
            "empresa": "Sin empresa asignada",
            "periodo": "Sin periodo asignado"
        },
        "horas": {
            "acumuladas": horas_acumuladas,
            "total": horas_totales,
            "porcentaje": porcentaje
        },
        "documentos": {
            "aprobados": aprobados,
            "revision": en_revision,
            "pendientes": pendientes,
            "total": total_documentos
        }
    }