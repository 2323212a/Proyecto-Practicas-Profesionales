from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from infrastructure.database.dependencies import obtener_db
from infrastructure.persistence.models.notificacion import NotificacionModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.security.auth_dependencies import es_admin, obtener_usuario_actual, requerir_roles
from interfaces.api.schemas.notificacion import NotificacionCreate, NotificacionResponse, NotificacionUpdate


router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


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
    return (
        db.query(NotificacionModel)
        .filter(NotificacionModel.id_usuario == id_usuario)
        .order_by(NotificacionModel.fecha_envio.desc())
        .all()
    )


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
    no_leidas = query.filter(NotificacionModel.leida == False).count()  # noqa: E712
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
        NotificacionModel.leida == False,  # noqa: E712
    ).update({"leida": True})
    db.commit()
    return resumen_notificaciones_usuario(id_usuario, db, usuario_actual)


@router.patch("/me/marcar-todas")
def marcar_todas_mis_notificaciones(
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
    db: Session = Depends(obtener_db),
):
    return marcar_todas_notificaciones_usuario(usuario_actual.id_usuario, db, usuario_actual)


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
