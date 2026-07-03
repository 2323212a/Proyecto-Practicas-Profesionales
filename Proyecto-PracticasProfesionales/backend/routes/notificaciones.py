from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from models.usuario import UsuarioModel
from routes.alumno_documentacion import obtener_usuario_actual

router = APIRouter(prefix="/notificaciones", tags=["Notificaciones"])


def serializar_notificacion(row):
    fecha = row["fecha_envio"]
    return {
        "id_notificacion": row["id_notificacion"],
        "titulo": row["titulo"] or "Notificacion",
        "mensaje": row["mensaje"] or "",
        "leida": bool(row["leida"]),
        "fecha_envio": fecha.isoformat() if hasattr(fecha, "isoformat") else fecha,
        "tipo": clasificar_tipo(row["titulo"] or "", row["mensaje"] or ""),
    }


def clasificar_tipo(titulo: str, mensaje: str):
    texto = f"{titulo} {mensaje}".lower()
    if "aprob" in texto or "valid" in texto:
        return "aprobado"
    if "rechaz" in texto or "correccion" in texto or "corrección" in texto:
        return "rechazado"
    if "observ" in texto or "hora" in texto or "falt" in texto or "pendiente" in texto:
        return "advertencia"
    return "info"


@router.get("")
def listar_notificaciones(
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    filas = db.execute(
        text(
            """
            SELECT id_notificacion, titulo, mensaje, leida, fecha_envio
            FROM notificacion
            WHERE id_usuario = :id_usuario
            ORDER BY fecha_envio DESC, id_notificacion DESC
            """
        ),
        {"id_usuario": usuario_actual.id_usuario},
    ).mappings().all()
    return [serializar_notificacion(fila) for fila in filas]


@router.patch("/{id_notificacion}/leer")
def marcar_notificacion_leida(
    id_notificacion: int,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    resultado = db.execute(
        text(
            """
            UPDATE notificacion
            SET leida = 1
            WHERE id_notificacion = :id_notificacion
              AND id_usuario = :id_usuario
            """
        ),
        {"id_notificacion": id_notificacion, "id_usuario": usuario_actual.id_usuario},
    )
    db.commit()
    if resultado.rowcount == 0:
        raise HTTPException(status_code=404, detail="Notificacion no encontrada")
    return {"mensaje": "Notificacion marcada como leida"}


@router.patch("/leer-todas")
def marcar_todas_leidas(
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    db.execute(
        text("UPDATE notificacion SET leida = 1 WHERE id_usuario = :id_usuario"),
        {"id_usuario": usuario_actual.id_usuario},
    )
    db.commit()
    return {"mensaje": "Notificaciones marcadas como leidas"}