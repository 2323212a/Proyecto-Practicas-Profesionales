from __future__ import annotations

import asyncio
import os
import smtplib
from datetime import datetime
from email.message import EmailMessage

from sqlalchemy.orm import Session

from infrastructure.database.connection import SessionLocal
from infrastructure.persistence.models.cola_correos import ColaCorreosModel


ESTADO_PENDIENTE = "PENDIENTE"
ESTADO_ENVIADO = "ENVIADO"
ESTADO_ERROR = "ERROR"


def encolar_correo(
    db: Session,
    destinatario: str,
    asunto: str,
    contenido: str,
    contenido_html: str | None = None,
) -> None:
    correo = destinatario.strip().lower()
    if not correo:
        return
    db.add(
        ColaCorreosModel(
            destinatario=correo,
            asunto=asunto[:200],
            contenido=contenido,
            contenido_html=contenido_html,
            estado=ESTADO_PENDIENTE,
        )
    )


def _obtener_config_smtp() -> dict[str, str | int | bool | None]:
    return {
        "host": os.getenv("SMTP_HOST"),
        "port": int(os.getenv("SMTP_PORT", "587")),
        "user": os.getenv("SMTP_USER"),
        "password": os.getenv("SMTP_PASSWORD"),
        "from": os.getenv("SMTP_FROM") or os.getenv("SMTP_USER"),
        "starttls": os.getenv("SMTP_STARTTLS", "1") == "1",
        "ssl": os.getenv("SMTP_SSL", "0") == "1",
    }


def _enviar_correo_smtp(
    destinatario: str,
    asunto: str,
    contenido: str,
    contenido_html: str | None = None,
) -> None:
    config = _obtener_config_smtp()
    host = config["host"]
    remitente = config["from"]
    if not host or not remitente:
        raise RuntimeError("SMTP no configurado (SMTP_HOST/SMTP_FROM)")

    mensaje = EmailMessage()
    mensaje["Subject"] = asunto
    mensaje["From"] = str(remitente)
    mensaje["To"] = destinatario
    mensaje.set_content(contenido)
    if contenido_html:
        mensaje.add_alternative(contenido_html, subtype="html")

    if config["ssl"]:
        with smtplib.SMTP_SSL(str(host), int(config["port"])) as servidor:
            if config["user"] and config["password"]:
                servidor.login(str(config["user"]), str(config["password"]))
            servidor.send_message(mensaje)
        return

    with smtplib.SMTP(str(host), int(config["port"])) as servidor:
        if config["starttls"]:
            servidor.starttls()
        if config["user"] and config["password"]:
            servidor.login(str(config["user"]), str(config["password"]))
        servidor.send_message(mensaje)


def procesar_cola_correos(db: Session, *, max_lote: int = 20, max_intentos: int = 3) -> int:
    pendientes = (
        db.query(ColaCorreosModel)
        .filter(
            ColaCorreosModel.estado.in_([ESTADO_PENDIENTE, ESTADO_ERROR]),
            ColaCorreosModel.intentos < max_intentos,
        )
        .order_by(ColaCorreosModel.fecha_creacion.asc())
        .limit(max_lote)
        .all()
    )

    procesados = 0
    for item in pendientes:
        item.intentos += 1
        try:
            _enviar_correo_smtp(
                item.destinatario,
                item.asunto,
                item.contenido,
                item.contenido_html,
            )
            item.estado = ESTADO_ENVIADO
            item.fecha_envio = datetime.now()
            item.error_ultimo = None
        except Exception as error:  # pragma: no cover - depende del entorno SMTP
            item.estado = ESTADO_ERROR
            item.error_ultimo = str(error)
        procesados += 1

    if procesados:
        db.commit()
    return procesados


async def worker_cola_correos() -> None:
    intervalo = int(os.getenv("EMAIL_QUEUE_POLL_SECONDS", "30"))
    max_lote = int(os.getenv("EMAIL_QUEUE_BATCH_SIZE", "20"))
    max_intentos = int(os.getenv("EMAIL_QUEUE_MAX_RETRIES", "3"))

    while True:
        db = SessionLocal()
        try:
            procesar_cola_correos(db, max_lote=max_lote, max_intentos=max_intentos)
        finally:
            db.close()
        await asyncio.sleep(intervalo)
