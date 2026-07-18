from __future__ import annotations

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session, joinedload

from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import requerir_roles
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.personal_interno import PersonalInternoModel
from infrastructure.persistence.models.rol import RolModel
from infrastructure.persistence.models.usuario import UsuarioModel


router = APIRouter(
    prefix="/coordinador/asignacion-asesores",
    tags=["Coordinador - Asignacion Asesores"],
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)


def nombre_usuario(usuario: UsuarioModel | None):
    if usuario is None:
        return "Sin usuario"
    perfil = usuario.personal_interno or usuario.alumno
    partes = [
        getattr(perfil, "nombre", None),
        getattr(perfil, "apellido_paterno", None),
        getattr(perfil, "apellido_materno", None),
    ]
    return " ".join(parte for parte in partes if parte) or usuario.correo


def nombre_alumno(alumno: AlumnoModel | None):
    if alumno is None:
        return "Sin alumno"
    return " ".join(
        parte
        for parte in [alumno.nombre, alumno.apellido_paterno, alumno.apellido_materno]
        if parte
    )


@router.get("/")
def listar_asignaciones_para_asesor(db: Session = Depends(obtener_db)):
    asesores = (
        db.query(PersonalInternoModel)
        .join(PersonalInternoModel.usuario)
        .join(UsuarioModel.rol)
        .options(joinedload(PersonalInternoModel.usuario))
        .filter(RolModel.id_rol == 6, UsuarioModel.estado == "Activo")
        .order_by(PersonalInternoModel.id_personal.asc())
        .all()
    )

    asignaciones = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.empresa),
            joinedload(AsignacionModel.vacante),
            joinedload(AsignacionModel.asesor).joinedload(PersonalInternoModel.usuario),
        )
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .all()
    )

    return {
        "asesores": [
            {
                "id_asesor": asesor.id_personal,
                "id_personal": asesor.id_personal,
                "id_usuario": asesor.id_usuario,
                "nombre": nombre_usuario(asesor.usuario),
                "correo": asesor.usuario.correo if asesor.usuario else None,
                "departamento": asesor.departamento,
                "asignaciones_activas": sum(
                    1
                    for asignacion in asesor.asignaciones
                    if asignacion.estado_asignacion == "Activa"
                ),
            }
            for asesor in asesores
        ],
        "asignaciones": [
            {
                "id_asignacion": asignacion.id_asignacion,
                "id_asesor": asignacion.id_asesor,
                "alumno": nombre_alumno(asignacion.alumno),
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
                "asesor": (
                    nombre_usuario(asignacion.asesor.usuario)
                    if asignacion.asesor
                    else "Sin asignar"
                ),
                "estado_asignacion": asignacion.estado_asignacion,
                "fecha_asignacion": asignacion.fecha_asignacion,
            }
            for asignacion in asignaciones
        ],
    }
