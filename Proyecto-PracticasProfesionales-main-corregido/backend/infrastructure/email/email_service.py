from __future__ import annotations

import html
import os
import smtplib
from email.message import EmailMessage


class EmailError(Exception):
    pass


class EmailConfigError(EmailError):
    pass


def _frontend_url() -> str:
    return os.getenv("FRONTEND_URL", "http://localhost:5173").rstrip("/")


def _correo_habilitado() -> bool:
    return os.getenv("EMAIL_ENABLED", "false").strip().lower() in {"1", "true", "yes", "on"}


def _smtp_config() -> dict[str, str | int]:
    if not _correo_habilitado():
        raise EmailConfigError("El envio de correo esta deshabilitado.")

    host = os.getenv("SMTP_HOST")
    port = os.getenv("SMTP_PORT", "587")
    user = os.getenv("SMTP_USER")
    password = os.getenv("SMTP_PASSWORD")
    from_name = os.getenv("SMTP_FROM_NAME", "Sistema de Practicas Profesionales")

    faltantes = [
        nombre
        for nombre, valor in {
            "SMTP_HOST": host,
            "SMTP_USER": user,
            "SMTP_PASSWORD": password,
        }.items()
        if not valor
    ]
    if faltantes:
        raise EmailConfigError(
            f"No se pudo enviar el correo de acceso. Faltan variables SMTP: {', '.join(faltantes)}."
        )

    try:
        port_int = int(port)
    except (TypeError, ValueError) as error:
        raise EmailConfigError("SMTP_PORT debe ser numerico.") from error

    return {
        "host": str(host),
        "port": port_int,
        "user": str(user),
        "password": str(password),
        "from_name": from_name,
    }


def enviar_correo(
    destinatario: str,
    asunto: str,
    cuerpo_html: str,
    cuerpo_texto: str | None = None,
) -> None:
    config = _smtp_config()

    mensaje = EmailMessage()
    mensaje["Subject"] = asunto
    mensaje["From"] = f"{config['from_name']} <{config['user']}>"
    mensaje["To"] = destinatario
    mensaje.set_content(cuerpo_texto or _html_a_texto(cuerpo_html))
    mensaje.add_alternative(cuerpo_html, subtype="html")

    try:
        with smtplib.SMTP(str(config["host"]), int(config["port"]), timeout=20) as smtp:
            smtp.starttls()
            smtp.login(str(config["user"]), str(config["password"]))
            smtp.send_message(mensaje)
    except smtplib.SMTPException as error:
        raise EmailError("No se pudo enviar el correo de acceso.") from error
    except OSError as error:
        raise EmailError("No se pudo conectar con el servidor SMTP.") from error


def enviar_credenciales_login(
    destinatario: str,
    nombre: str,
    correo_acceso: str,
    password_temporal: str,
    rol: str,
) -> None:
    login_url = f"{_frontend_url()}/login"
    nombre_seguro = html.escape(nombre or "Usuario")
    correo_seguro = html.escape(correo_acceso)
    rol_seguro = html.escape(rol or "Usuario")
    login_seguro = html.escape(login_url)
    password_seguro = html.escape(password_temporal)

    cuerpo_texto = f"""Hola, {nombre or 'Usuario'}.

Se ha creado una cuenta para acceder al Sistema de Practicas Profesionales.

Rol: {rol or 'Usuario'}

Datos de acceso:
Correo: {correo_acceso}
Contrasena temporal: {password_temporal}

Enlace:
{login_url}

Por seguridad:
- No compartas estos datos.
- Cambia tu contrasena cuando el sistema lo solicite.
- Si no solicitaste esta cuenta, contacta a la coordinacion.

Atentamente,
Sistema de Practicas Profesionales
"""

    cuerpo_html = f"""
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
      <h2 style="color: #0d2b5e;">Acceso al Sistema de Practicas Profesionales</h2>
      <p>Hola, <strong>{nombre_seguro}</strong>.</p>
      <p>Se ha creado una cuenta para acceder al Sistema de Practicas Profesionales.</p>
      <p><strong>Rol:</strong> {rol_seguro}</p>
      <div style="background: #f4f7fb; border: 1px solid #dbeafe; border-radius: 10px; padding: 14px; margin: 16px 0;">
        <p style="margin: 0 0 8px;"><strong>Datos de acceso</strong></p>
        <p style="margin: 0;">Correo: {correo_seguro}</p>
        <p style="margin: 0;">Contrasena temporal: {password_seguro}</p>
      </div>
      <p>Enlace: <a href="{login_seguro}">{login_seguro}</a></p>
      <p><strong>Por seguridad:</strong></p>
      <ul>
        <li>No compartas estos datos.</li>
        <li>Cambia tu contrasena cuando el sistema lo solicite.</li>
        <li>Si no solicitaste esta cuenta, contacta a la coordinacion.</li>
      </ul>
      <p>Atentamente,<br/>Sistema de Practicas Profesionales</p>
    </div>
    """

    enviar_correo(
        destinatario,
        "Acceso al Sistema de Practicas Profesionales",
        cuerpo_html,
        cuerpo_texto,
    )


def enviar_credenciales_empresa_aceptada(
    destinatario: str,
    nombre_responsable: str,
    nombre_empresa: str,
    correo_acceso: str,
    password_temporal: str,
) -> None:
    login_url = f"{_frontend_url()}/login"
    responsable_seguro = html.escape(nombre_responsable or "Responsable")
    empresa_segura = html.escape(nombre_empresa or "la empresa")
    correo_seguro = html.escape(correo_acceso)
    login_seguro = html.escape(login_url)
    password_seguro = html.escape(password_temporal)

    cuerpo_texto = f"""Hola, {nombre_responsable or 'Responsable'}.

La solicitud de registro de {nombre_empresa or 'la empresa'} fue aceptada.

Se ha creado una cuenta para que puedas continuar con el proceso de documentacion, convenio y registro de vacantes.

Datos de acceso:
Correo: {correo_acceso}
Contrasena temporal: {password_temporal}

Accede aqui:
{login_url}

Atentamente,
Sistema de Practicas Profesionales
"""

    cuerpo_html = f"""
    <div style="font-family: Arial, sans-serif; color: #1f2937; line-height: 1.5;">
      <h2 style="color: #0d2b5e;">Solicitud aceptada - Acceso al Sistema de Practicas Profesionales</h2>
      <p>Hola, <strong>{responsable_seguro}</strong>.</p>
      <p>La solicitud de registro de <strong>{empresa_segura}</strong> fue aceptada.</p>
      <p>Se ha creado una cuenta para que puedas continuar con el proceso de documentacion, convenio y registro de vacantes.</p>
      <div style="background: #f4f7fb; border: 1px solid #dbeafe; border-radius: 10px; padding: 14px; margin: 16px 0;">
        <p style="margin: 0 0 8px;"><strong>Datos de acceso</strong></p>
        <p style="margin: 0;">Correo: {correo_seguro}</p>
        <p style="margin: 0;">Contrasena temporal: {password_seguro}</p>
      </div>
      <p>Accede aqui: <a href="{login_seguro}">{login_seguro}</a></p>
      <p>Atentamente,<br/>Sistema de Practicas Profesionales</p>
    </div>
    """

    enviar_correo(
        destinatario,
        "Solicitud aceptada - Acceso al Sistema de Practicas Profesionales",
        cuerpo_html,
        cuerpo_texto,
    )


def _html_a_texto(cuerpo_html: str) -> str:
    return cuerpo_html.replace("<br/>", "\n").replace("<br>", "\n")
