import os
from enum import Enum
from typing import Optional

from sqlalchemy.orm import Session

from app.services.cola_correos_service import encolar_correo
from infrastructure.persistence.models.notificacion import NotificacionModel
from infrastructure.persistence.models.rol import RolModel
from infrastructure.persistence.models.usuario import UsuarioModel


EMAIL_FEATURE_ENABLED = os.getenv("EMAIL_FEATURE_ENABLED", "1") == "1"


class EventoNotificacion(str, Enum):
    EMPRESA_APROBADA = "EMPRESA_APROBADA"
    EMPRESA_RECHAZADA = "EMPRESA_RECHAZADA"
    DOCUMENTO_APROBADO = "DOCUMENTO_APROBADO"
    DOCUMENTO_RECHAZADO = "DOCUMENTO_RECHAZADO"
    CONVENIO_POR_VENCER = "CONVENIO_POR_VENCER"
    CONVENIO_VENCIDO = "CONVENIO_VENCIDO"
    NUEVA_OBSERVACION = "NUEVA_OBSERVACION"
    VACANTE_APROBADA = "VACANTE_APROBADA"
    VACANTE_RECHAZADA = "VACANTE_RECHAZADA"
    NUEVA_CONVOCATORIA = "NUEVA_CONVOCATORIA"


PLANTILLAS_EVENTO: dict[EventoNotificacion, tuple[str, str]] = {
    EventoNotificacion.EMPRESA_APROBADA: (
        "Empresa aprobada",
        "La empresa {empresa} fue aprobada y puede continuar con el proceso.",
    ),
    EventoNotificacion.EMPRESA_RECHAZADA: (
        "Empresa rechazada",
        "La empresa {empresa} fue rechazada. Motivo: {motivo}.",
    ),
    EventoNotificacion.DOCUMENTO_APROBADO: (
        "Documento aprobado",
        "El documento {tipo_documento} fue aprobado.",
    ),
    EventoNotificacion.DOCUMENTO_RECHAZADO: (
        "Documento rechazado",
        "El documento {tipo_documento} fue rechazado. Motivo: {observacion}.",
    ),
    EventoNotificacion.CONVENIO_POR_VENCER: (
        "Convenio por vencer",
        "El convenio de {empresa} vencera el {fecha_fin}.",
    ),
    EventoNotificacion.CONVENIO_VENCIDO: (
        "Convenio vencido",
        "El convenio de {empresa} ya vencio el {fecha_fin}.",
    ),
    EventoNotificacion.NUEVA_OBSERVACION: (
        "Nueva observacion",
        "Se registro una observacion: {observacion}.",
    ),
    EventoNotificacion.VACANTE_APROBADA: (
        "Vacante aprobada",
        "La vacante {vacante} de {empresa} fue aprobada para continuar en el flujo.",
    ),
    EventoNotificacion.VACANTE_RECHAZADA: (
        "Vacante rechazada",
        "La vacante {vacante} de {empresa} fue rechazada. Motivo: {observacion}.",
    ),
    EventoNotificacion.NUEVA_CONVOCATORIA: (
        "Nueva convocatoria",
        "Hay una nueva convocatoria disponible: {convocatoria}.",
    ),
}


PLANTILLAS_EVENTO_HTML: dict[EventoNotificacion, str] = {
    EventoNotificacion.EMPRESA_APROBADA: """
        <p>Estimado(a),</p>
        <p>La empresa <strong>{empresa}</strong> fue aprobada y puede continuar con el proceso.</p>
        <p>Atentamente,<br/>Coordinacion de Unidades Receptoras</p>
    """,
    EventoNotificacion.EMPRESA_RECHAZADA: """
        <p>Estimado(a),</p>
        <p>La empresa <strong>{empresa}</strong> fue rechazada.</p>
        <p><strong>Motivo:</strong> {motivo}</p>
        <p>Atentamente,<br/>Coordinacion de Unidades Receptoras</p>
    """,
    EventoNotificacion.DOCUMENTO_APROBADO: """
        <p>Estimado(a),</p>
        <p>El documento <strong>{tipo_documento}</strong> fue aprobado.</p>
        <p>Atentamente,<br/>Coordinacion de Unidades Receptoras</p>
    """,
    EventoNotificacion.DOCUMENTO_RECHAZADO: """
        <p>Estimado(a),</p>
        <p>El documento <strong>{tipo_documento}</strong> fue rechazado.</p>
        <p><strong>Motivo:</strong> {observacion}</p>
        <p>Ingrese al sistema para realizar las correcciones.</p>
    """,
    EventoNotificacion.CONVENIO_POR_VENCER: """
        <p>Estimado(a),</p>
        <p>El convenio de <strong>{empresa}</strong> vencera el <strong>{fecha_fin}</strong>.</p>
    """,
    EventoNotificacion.CONVENIO_VENCIDO: """
        <p>Estimado(a),</p>
        <p>El convenio de <strong>{empresa}</strong> vencio el <strong>{fecha_fin}</strong>.</p>
    """,
    EventoNotificacion.NUEVA_OBSERVACION: """
        <p>Estimado(a),</p>
        <p>Se registro una nueva observacion:</p>
        <blockquote>{observacion}</blockquote>
    """,
    EventoNotificacion.VACANTE_APROBADA: """
        <p>Estimado(a),</p>
        <p>La vacante <strong>{vacante}</strong> de <strong>{empresa}</strong> fue aprobada para continuar en el flujo.</p>
    """,
    EventoNotificacion.VACANTE_RECHAZADA: """
        <p>Estimado(a),</p>
        <p>La vacante <strong>{vacante}</strong> de <strong>{empresa}</strong> fue rechazada.</p>
        <p><strong>Motivo:</strong> {observacion}</p>
    """,
    EventoNotificacion.NUEVA_CONVOCATORIA: """
        <p>Estimado(a),</p>
        <p>Hay una nueva convocatoria disponible: <strong>{convocatoria}</strong>.</p>
    """,
}


def _envolver_html_correo(titulo: str, cuerpo_html: str) -> str:
    return f"""
    <html>
      <body style=\"font-family:Arial,Helvetica,sans-serif;color:#1f2937;line-height:1.5;\">
        <div style=\"max-width:640px;margin:0 auto;padding:20px;border:1px solid #e5e7eb;border-radius:10px;\">
          <h2 style=\"margin-top:0;color:#0d2b5e;\">{titulo}</h2>
          {cuerpo_html}
          <hr style=\"border:none;border-top:1px solid #e5e7eb;margin:20px 0;\"/>
          <p style=\"font-size:12px;color:#6b7280;\">Este mensaje fue generado automaticamente por el sistema de practicas.</p>
        </div>
      </body>
    </html>
    """.strip()


def _render_evento(
    evento: EventoNotificacion,
    variables: dict[str, str] | None = None,
) -> tuple[str, str, str]:
    titulo_template, mensaje_template = PLANTILLAS_EVENTO[evento]
    html_template = PLANTILLAS_EVENTO_HTML[evento]
    datos = {k: str(v) for k, v in (variables or {}).items()}

    class _DefaultDict(dict[str, str]):
        def __missing__(self, key: str) -> str:  # pragma: no cover - comportamiento defensivo
            return ""

    valores = _DefaultDict(datos)
    titulo = titulo_template.format_map(valores)
    mensaje = mensaje_template.format_map(valores)
    cuerpo_html = html_template.format_map(valores)
    html = _envolver_html_correo(titulo, cuerpo_html)
    return titulo, mensaje, html


def crear_notificacion(db: Session, id_usuario: Optional[int], titulo: str, mensaje: str) -> None:
    if not id_usuario:
        return
    db.add(
        NotificacionModel(
            id_usuario=id_usuario,
            titulo=titulo[:150],
            mensaje=mensaje,
            leida=False,
        )
    )


def notificar_roles(db: Session, roles: list[str], titulo: str, mensaje: str) -> None:
    usuarios = (
        db.query(UsuarioModel)
        .join(RolModel, RolModel.id_rol == UsuarioModel.id_rol)
        .filter(
            UsuarioModel.estado == "Activo",
            RolModel.nombre.in_(roles),
        )
        .all()
    )
    for usuario in usuarios:
        crear_notificacion(db, usuario.id_usuario, titulo, mensaje)


def notificar_evento_usuario(
    db: Session,
    id_usuario: Optional[int],
    evento: EventoNotificacion,
    variables: dict[str, str] | None = None,
) -> None:
    if not id_usuario:
        return
    titulo, mensaje, html = _render_evento(evento, variables)
    crear_notificacion(db, id_usuario, titulo, mensaje)
    if not EMAIL_FEATURE_ENABLED:
        return
    usuario = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == id_usuario).first()
    if usuario and usuario.correo:
        encolar_correo(db, usuario.correo, titulo, mensaje, contenido_html=html)


def notificar_evento_roles(
    db: Session,
    roles: list[str],
    evento: EventoNotificacion,
    variables: dict[str, str] | None = None,
) -> None:
    titulo, mensaje, html = _render_evento(evento, variables)
    usuarios = (
        db.query(UsuarioModel)
        .join(RolModel, RolModel.id_rol == UsuarioModel.id_rol)
        .filter(
            UsuarioModel.estado == "Activo",
            RolModel.nombre.in_(roles),
        )
        .all()
    )
    for usuario in usuarios:
        crear_notificacion(db, usuario.id_usuario, titulo, mensaje)
        if EMAIL_FEATURE_ENABLED and usuario.correo:
            encolar_correo(db, usuario.correo, titulo, mensaje, contenido_html=html)
