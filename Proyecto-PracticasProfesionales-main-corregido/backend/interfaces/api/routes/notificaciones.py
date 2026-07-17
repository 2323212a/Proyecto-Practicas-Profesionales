from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.incidencia_practica import IncidenciaPracticaModel
from infrastructure.persistence.models.notificacion import NotificacionModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.security.auth_dependencies import es_admin, obtener_usuario_actual, requerir_roles
from interfaces.api.schemas.notificacion import NotificacionCreate, NotificacionResponse, NotificacionUpdate


router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


def _nombre_alumno(alumno: AlumnoModel) -> str:
    usuario = alumno.usuario
    if usuario is None:
        return "Sin alumno"
    return " ".join(
        parte
        for parte in [usuario.nombre, usuario.apellido_paterno, usuario.apellido_materno]
        if parte
    )


def _empresa_alumno(db: Session, alumno: AlumnoModel) -> str:
    asignacion = (
        db.query(AsignacionModel)
        .filter(
            AsignacionModel.id_alumno == alumno.id_alumno,
            AsignacionModel.estado_asignacion == "Activa",
        )
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .first()
    )
    return asignacion.empresa.nombre_empresa if asignacion and asignacion.empresa else "Sin empresa asignada"


def _notificacion_response(db: Session, notificacion: NotificacionModel) -> dict:
    mensaje = notificacion.mensaje
    if mensaje.startswith("Alumno:"):
        return {
            "id_notificacion": notificacion.id_notificacion,
            "id_usuario": notificacion.id_usuario,
            "titulo": notificacion.titulo,
            "mensaje": mensaje,
            "leida": notificacion.leida,
            "fecha_envio": notificacion.fecha_envio,
        }

    if notificacion.titulo == "Documento de alumno recibido":
        matricula = mensaje.split(" ", 1)[0]
        alumno = db.query(AlumnoModel).filter(AlumnoModel.matricula == matricula).first()
        if alumno is not None:
            detalle = mensaje.split(" subio ", 1)[1] if " subio " in mensaje else mensaje
            mensaje = (
                f"Alumno: {_nombre_alumno(alumno)} ({alumno.matricula}). "
                f"Empresa: {_empresa_alumno(db, alumno)}. Documento: {detalle}"
            )
    elif notificacion.titulo in {
        "Incidencia reportada por alumno",
        "Incidencia reportada por empresa",
    }:
        reportante = "Alumno" if "por alumno" in notificacion.titulo else "Empresa"
        incidencia = (
            db.query(IncidenciaPracticaModel)
            .filter(
                IncidenciaPracticaModel.reportante == reportante,
                IncidenciaPracticaModel.fecha_reporte
                <= notificacion.fecha_envio + timedelta(seconds=5),
            )
            .order_by(IncidenciaPracticaModel.fecha_reporte.desc())
            .first()
        )
        asignacion = incidencia.asignacion if incidencia else None
        alumno = asignacion.alumno if asignacion else None
        if incidencia and alumno:
            mensaje = (
                f"Alumno: {_nombre_alumno(alumno)}. Empresa: "
                f"{asignacion.empresa.nombre_empresa if asignacion.empresa else 'Sin empresa asignada'}. "
                f"Prioridad: {incidencia.prioridad}. Tipo: {incidencia.tipo_incidencia}."
            )

    return {
        "id_notificacion": notificacion.id_notificacion,
        "id_usuario": notificacion.id_usuario,
        "titulo": notificacion.titulo,
        "mensaje": mensaje,
        "leida": notificacion.leida,
        "fecha_envio": notificacion.fecha_envio,
    }


@router.get("/", response_model=list[NotificacionResponse])
def listar_notificaciones(
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(requerir_roles(["Administrador"])),
):
    return db.query(NotificacionModel).order_by(NotificacionModel.fecha_envio.desc()).all()


@router.get("/usuario/{id_usuario}", response_model=list[NotificacionResponse])
def listar_notificaciones_usuario(
    id_usuario: int,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    if usuario_actual.id_usuario != id_usuario and not es_admin(usuario_actual):
        raise HTTPException(status_code=403, detail="No puedes consultar notificaciones de otro usuario")
    notificaciones = (
        db.query(NotificacionModel)
        .filter(NotificacionModel.id_usuario == id_usuario)
        .order_by(NotificacionModel.fecha_envio.desc())
        .all()
    )
    return [_notificacion_response(db, item) for item in notificaciones]


@router.get("/me/", response_model=list[NotificacionResponse])
def listar_mis_notificaciones(
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
    db: Session = Depends(obtener_db),
):
    return listar_notificaciones_usuario(usuario_actual.id_usuario, db, usuario_actual)


@router.get("/usuario/{id_usuario}/resumen")
def resumen_notificaciones_usuario(
    id_usuario: int,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    if usuario_actual.id_usuario != id_usuario and not es_admin(usuario_actual):
        raise HTTPException(status_code=403, detail="No puedes consultar notificaciones de otro usuario")
    query = db.query(NotificacionModel).filter(NotificacionModel.id_usuario == id_usuario)
    total = query.count()
    no_leidas = query.filter(NotificacionModel.leida.is_(False)).count()  # noqa: E712
    return {"total": total, "no_leidas": no_leidas, "leidas": total - no_leidas}


@router.get("/me/resumen")
def resumen_mis_notificaciones(
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
    db: Session = Depends(obtener_db),
):
    return resumen_notificaciones_usuario(usuario_actual.id_usuario, db, usuario_actual)


@router.patch("/usuario/{id_usuario}/marcar-todas")
def marcar_todas_notificaciones_usuario(
    id_usuario: int,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    if usuario_actual.id_usuario != id_usuario and not es_admin(usuario_actual):
        raise HTTPException(status_code=403, detail="No puedes modificar notificaciones de otro usuario")
    db.query(NotificacionModel).filter(
        NotificacionModel.id_usuario == id_usuario,
        NotificacionModel.leida.is_(False),  # noqa: E712
    ).update({"leida": True})
    db.commit()
    return resumen_notificaciones_usuario(id_usuario, db, usuario_actual)


@router.patch("/me/marcar-todas")
def marcar_todas_mis_notificaciones(
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
    db: Session = Depends(obtener_db),
):
    return marcar_todas_notificaciones_usuario(usuario_actual.id_usuario, db, usuario_actual)


@router.delete("/me/limpiar")
def limpiar_mi_bandeja(
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
    db: Session = Depends(obtener_db),
):
    eliminadas = (
        db.query(NotificacionModel)
        .filter(NotificacionModel.id_usuario == usuario_actual.id_usuario)
        .delete(synchronize_session=False)
    )
    db.commit()
    return {"mensaje": "Bandeja de notificaciones limpiada", "eliminadas": eliminadas}


@router.get("/{id_notificacion}", response_model=NotificacionResponse)
def obtener_notificacion(
    id_notificacion: int,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    notificacion = db.query(NotificacionModel).filter(
        NotificacionModel.id_notificacion == id_notificacion
    ).first()
    if notificacion is None:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    if notificacion.id_usuario != usuario_actual.id_usuario and not es_admin(usuario_actual):
        raise HTTPException(status_code=403, detail="No puedes consultar esta notificacion")
    return notificacion


@router.post("/", response_model=NotificacionResponse)
def crear_notificacion(
    notificacion: NotificacionCreate,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(requerir_roles(["Administrador"])),
):
    nueva_notificacion = NotificacionModel(**notificacion.model_dump())
    db.add(nueva_notificacion)
    db.commit()
    db.refresh(nueva_notificacion)
    return nueva_notificacion


@router.patch("/{id_notificacion}", response_model=NotificacionResponse)
def actualizar_notificacion(
    id_notificacion: int,
    datos: NotificacionUpdate,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    notificacion = db.query(NotificacionModel).filter(
        NotificacionModel.id_notificacion == id_notificacion
    ).first()
    if notificacion is None:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    if notificacion.id_usuario != usuario_actual.id_usuario and not es_admin(usuario_actual):
        raise HTTPException(status_code=403, detail="No puedes modificar esta notificacion")

    notificacion.leida = datos.leida
    db.commit()
    db.refresh(notificacion)
    return notificacion


@router.delete("/{id_notificacion}")
def eliminar_notificacion(
    id_notificacion: int,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    notificacion = db.query(NotificacionModel).filter(
        NotificacionModel.id_notificacion == id_notificacion
    ).first()
    if notificacion is None:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    if notificacion.id_usuario != usuario_actual.id_usuario and not es_admin(usuario_actual):
        raise HTTPException(status_code=403, detail="No puedes eliminar esta notificacion")

    db.delete(notificacion)
    db.commit()
    return {"mensaje": "Notificacion eliminada correctamente"}
