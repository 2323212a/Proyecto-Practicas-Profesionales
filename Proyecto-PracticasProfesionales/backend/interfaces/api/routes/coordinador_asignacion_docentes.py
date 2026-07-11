from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import requerir_roles
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.docente_asesor import DocenteAsesorModel
from infrastructure.persistence.models.usuario import UsuarioModel


router = APIRouter(
    prefix="/coordinador/asignacion-docentes",
    tags=["Coordinador - Asignacion Docentes"],
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)


def nombre_usuario(usuario: UsuarioModel | None):
    if usuario is None:
        return "Sin usuario"
    partes = [usuario.nombre, usuario.apellido_paterno, usuario.apellido_materno]
    return " ".join(parte for parte in partes if parte) or usuario.correo


@router.get("/")
def listar_asignaciones_para_docente(db: Session = Depends(obtener_db)):
    docentes = (
        db.query(DocenteAsesorModel)
        .options(joinedload(DocenteAsesorModel.usuario))
        .order_by(DocenteAsesorModel.id_docente.asc())
        .all()
    )

    asignaciones = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.empresa),
            joinedload(AsignacionModel.vacante),
            joinedload(AsignacionModel.docente).joinedload(DocenteAsesorModel.usuario),
        )
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .all()
    )

    return {
        "docentes": [
            {
                "id_docente": docente.id_docente,
                "id_usuario": docente.id_usuario,
                "nombre": nombre_usuario(docente.usuario),
                "correo": docente.usuario.correo if docente.usuario else None,
                "departamento": docente.departamento,
                "asignaciones_activas": sum(
                    1
                    for asignacion in docente.asignaciones
                    if asignacion.estado_asignacion == "Activa"
                ),
            }
            for docente in docentes
        ],
        "asignaciones": [
            {
                "id_asignacion": asignacion.id_asignacion,
                "id_docente": asignacion.id_docente,
                "alumno": nombre_usuario(asignacion.alumno.usuario if asignacion.alumno else None),
                "matricula": asignacion.alumno.matricula if asignacion.alumno else None,
                "carrera": (
                    asignacion.alumno.carrera.nombre
                    if asignacion.alumno and asignacion.alumno.carrera
                    else "Sin carrera"
                ),
                "empresa": (
                    asignacion.empresa.nombre_empresa
                    if asignacion.empresa
                    else "Sin empresa"
                ),
                "vacante": asignacion.vacante.titulo if asignacion.vacante else "Sin vacante",
                "docente": (
                    nombre_usuario(asignacion.docente.usuario)
                    if asignacion.docente
                    else "Sin asignar"
                ),
                "estado_asignacion": asignacion.estado_asignacion,
                "fecha_asignacion": asignacion.fecha_asignacion,
            }
            for asignacion in asignaciones
        ],
    }
