from __future__ import annotations

import mimetypes
from datetime import date, datetime, timedelta
from pathlib import Path

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.services.auditoria_service import registrar_bitacora
from app.services.convocatoria_rules_service import validar_etapa_actual
from app.services.notificacion_service import crear_notificacion
from app.services.upload_security import (
    nombre_descarga_seguro,
    normalizar_nombre_archivo,
    resolver_archivo_en_uploads,
    validar_documento_liberacion,
)
from app.services.empresa_reglas_service import (
    obtener_convenio_vigente_actual,
    obtener_vinculacion_aprobada_actual,
    validar_habilitacion_empresa_para_vacantes,
)
from infrastructure.database.dependencies import obtener_db
from infrastructure.email.email_service import (
    enviar_correo_empresa_aceptada,
    enviar_correo_empresa_rechazada,
    mostrar_password_temporal_en_respuesta,
)
from infrastructure.security.auth_dependencies import requerir_roles
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.bitacora_auditoria import BitacoraAuditoriaModel
from infrastructure.persistence.models.carrera import CarreraModel
from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.documento_empresa import DocumentoEmpresaModel
from infrastructure.persistence.models.documento_vacante import DocumentoVacanteModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.formato_plan_trabajo_vacante import FormatoPlanTrabajoVacanteModel
from infrastructure.persistence.models.rol import RolModel
from infrastructure.persistence.models.solicitud_empresa import SolicitudEmpresaModel
from infrastructure.persistence.models.tipo_documento_empresa import TipoDocumentoEmpresaModel
from infrastructure.persistence.models.participacion_empresa_convocatoria import ParticipacionEmpresaConvocatoriaModel
from infrastructure.persistence.models.solicitud_ampliacion_cupos_vacante import SolicitudAmpliacionCuposVacanteModel
from infrastructure.persistence.models.solicitud_ampliacion_cupos_vacante_detalle import SolicitudAmpliacionCuposVacanteDetalleModel
from infrastructure.persistence.models.tipo_practica import TipoPracticaModel
from infrastructure.persistence.models.vacante import VacanteModel
from infrastructure.persistence.models.vacante_carrera import VacanteCarreraModel
from infrastructure.persistence.models.vacante_tipo_practica import VacanteTipoPracticaModel

import secrets
import string

from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.security.auth_dependencies import obtener_usuario_actual
from infrastructure.security.password import generar_password_hash

router = APIRouter(
    prefix="/coord-unidades/empresas",
    tags=["Coordinador Unidades - Empresas"],
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)

vacantes_router = APIRouter(
    prefix="/coord-unidades/vacantes",
    tags=["Coordinador Unidades - Vacantes"],
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)

UPLOADS_DIR = Path(__file__).resolve().parents[3] / "uploads"
UPLOAD_FORMATOS_PLAN_DIR = UPLOADS_DIR / "vacantes" / "formatos-plan-trabajo"


class CambiarEstadoEmpresaRequest(BaseModel):
    estado_empresa: str
    observaciones: str | None = None


class CambiarEstadoVacanteRequest(BaseModel):
    estado_vacante: str
    observaciones: str | None = None


class RechazarSolicitudRequest(BaseModel):
    motivo_rechazo: str
    observaciones: str | None = None


class RevisarParticipacionRequest(BaseModel):
    estado: str
    observaciones: str | None = None
    motivo_rechazo: str | None = None


class LiberarPrepadronRequest(BaseModel):
    id_convocatoria: int | None = None
    id_tipo_practica: int | None = None


class RevisarAmpliacionCuposRequest(BaseModel):
    observaciones: str | None = None


class RevisarAmpliacionCuposDetalleRequest(BaseModel):
    observaciones: str | None = None
    cupos_aprobados: dict[int, int] = {}


class CrearFormatoPlanTrabajoRequest(BaseModel):
    nombre: str
    descripcion: str | None = None
    id_convocatoria: int | None = None


def _plan_trabajo_vacante(db: Session, vacante: VacanteModel) -> dict | None:
    documento = (
        db.query(DocumentoVacanteModel)
        .filter(
            DocumentoVacanteModel.id_vacante == vacante.id_vacante,
            DocumentoVacanteModel.tipo_documento == "Plan de trabajo",
            DocumentoVacanteModel.activo.is_(True),
        )
        .order_by(DocumentoVacanteModel.id_documento_vacante.desc())
        .first()
    )
    if documento is None:
        return None
    return {
        "id_documento_vacante": documento.id_documento_vacante,
        "nombre_archivo": documento.nombre_archivo,
        "estado_documento": documento.estado_documento,
        "observaciones": documento.observaciones,
        "fecha_subida": documento.fecha_subida.isoformat() if documento.fecha_subida else None,
        "fecha_revision": documento.fecha_revision.isoformat() if documento.fecha_revision else None,
        "activo": bool(documento.activo),
        "url_descarga": f"/coord-unidades/empresas/vacantes/{vacante.id_vacante}/plan-trabajo/archivo",
    }


def _formato_plan_response(formato: FormatoPlanTrabajoVacanteModel) -> dict:
    return {
        "id_formato_plan": formato.id_formato_plan,
        "id_convocatoria": formato.id_convocatoria,
        "convocatoria": formato.convocatoria.nombre if formato.convocatoria else None,
        "nombre": formato.nombre,
        "descripcion": formato.descripcion,
        "nombre_archivo": formato.nombre_archivo,
        "activo": bool(formato.activo),
        "fecha_subida": formato.fecha_subida.isoformat() if formato.fecha_subida else None,
        "subido_por": formato.subido_por,
        "url_descarga": f"/coord-unidades/vacantes/formatos-plan-trabajo/{formato.id_formato_plan}/archivo",
    }


def _detalles_ampliacion_response(db: Session, solicitud: SolicitudAmpliacionCuposVacanteModel) -> list[dict]:
    detalles = solicitud.detalles
    if not detalles and solicitud.id_tipo_practica is not None:
        tipo = db.query(TipoPracticaModel).filter(TipoPracticaModel.id_tipo_practica == solicitud.id_tipo_practica).first()
        return [
            {
                "id_detalle_ampliacion": None,
                "id_tipo_practica": solicitud.id_tipo_practica,
                "tipo_practica": tipo.nombre if tipo else None,
                "cupos_solicitados": solicitud.cupos_solicitados,
                "cupos_aprobados": None,
                "estado": solicitud.estado,
                "observaciones": solicitud.observaciones,
            }
        ]
    return [
        {
            "id_detalle_ampliacion": detalle.id_detalle_ampliacion,
            "id_tipo_practica": detalle.id_tipo_practica,
            "tipo_practica": detalle.tipo_practica.nombre if detalle.tipo_practica else None,
            "cupos_solicitados": detalle.cupos_solicitados,
            "cupos_aprobados": detalle.cupos_aprobados,
            "estado": detalle.estado,
            "observaciones": detalle.observaciones,
        }
        for detalle in detalles
    ]


def _validar_documentacion_empresa_aprobada(db: Session, id_empresa: int) -> None:
    tipos_obligatorios = (
        db.query(TipoDocumentoEmpresaModel)
        .filter(
            TipoDocumentoEmpresaModel.activo.is_(True),
            TipoDocumentoEmpresaModel.obligatorio.is_(True),
            TipoDocumentoEmpresaModel.etapa == "Documentacion",
        )
        .all()
    )
    if not tipos_obligatorios:
        raise HTTPException(
            status_code=400,
            detail="No hay requisitos documentales obligatorios configurados para empresas",
        )

    documentos = (
        db.query(DocumentoEmpresaModel)
        .filter(DocumentoEmpresaModel.id_empresa == id_empresa)
        .all()
    )
    documentos_por_tipo = {
        documento.id_tipo_documento_empresa: documento
        for documento in documentos
    }

    faltantes = []
    pendientes = []
    rechazados = []
    for tipo in tipos_obligatorios:
        documento = documentos_por_tipo.get(tipo.id_tipo_documento_empresa)
        if documento is None:
            faltantes.append(tipo.nombre)
        elif documento.estado_documento == "Rechazado":
            rechazados.append(tipo.nombre)
        elif documento.estado_documento != "Aprobado":
            pendientes.append(tipo.nombre)

    if faltantes or pendientes or rechazados:
        detalles = []
        if faltantes:
            detalles.append(f"faltantes: {', '.join(faltantes)}")
        if pendientes:
            detalles.append(f"pendientes: {', '.join(pendientes)}")
        if rechazados:
            detalles.append(f"rechazados: {', '.join(rechazados)}")
        raise HTTPException(
            status_code=400,
            detail=(
                "No se puede aprobar la empresa hasta que todos los documentos "
                f"obligatorios esten aprobados ({'; '.join(detalles)})"
            ),
        )

def _generar_password_temporal(longitud: int = 10) -> str:
    caracteres = string.ascii_letters + string.digits
    return "".join(secrets.choice(caracteres) for _ in range(longitud))

def _tiene_convenio_vigente(db: Session, id_empresa: int) -> bool:
    return obtener_convenio_vigente_actual(db, id_empresa) is not None


def _empresa_publicable(db: Session, empresa: EmpresaModel) -> bool:
    if empresa.estado_empresa != "Activa":
        return False
    if empresa.tipo_tramite == "Convenio":
        return obtener_convenio_vigente_actual(db, empresa.id_empresa) is not None
    if empresa.tipo_tramite == "Vinculacion":
        return obtener_vinculacion_aprobada_actual(db, empresa.id_empresa) is not None
    return False


def _ultima_solicitud(db: Session, id_empresa: int) -> SolicitudEmpresaModel | None:
    return (
        db.query(SolicitudEmpresaModel)
        .filter(SolicitudEmpresaModel.id_empresa == id_empresa)
        .order_by(SolicitudEmpresaModel.id_solicitud_empresa.desc())
        .first()
    )


def _usuario_empresa(db: Session, id_empresa: int) -> UsuarioModel | None:
    responsable = (
        db.query(ResponsableEmpresaModel)
        .filter(ResponsableEmpresaModel.id_empresa == id_empresa)
        .first()
    )
    return responsable.usuario if responsable else None


def _extraer_detalle_empresa(empresa: EmpresaModel, etiqueta: str) -> str | None:
    if not empresa.domicilio:
        return None
    prefijo = f"{etiqueta}:"
    for linea in empresa.domicilio.splitlines():
        texto = linea.strip()
        if texto.lower().startswith(prefijo.lower()):
            return texto[len(prefijo):].strip() or None
    return None


@vacantes_router.get("/formatos-plan-trabajo")
def listar_formatos_plan_trabajo(db: Session = Depends(obtener_db)):
    formatos = (
        db.query(FormatoPlanTrabajoVacanteModel)
        .order_by(
            FormatoPlanTrabajoVacanteModel.activo.desc(),
            FormatoPlanTrabajoVacanteModel.id_formato_plan.desc(),
        )
        .all()
    )
    return [_formato_plan_response(formato) for formato in formatos]


@vacantes_router.post("/formatos-plan-trabajo")
def subir_formato_plan_trabajo(
    nombre: str | None = Form(None),
    descripcion: str | None = Form(None),
    id_convocatoria: str | None = Form(None),
    archivo: UploadFile | None = File(None),
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    nombre_limpio = " ".join((nombre or "").split())
    if not nombre_limpio:
        raise HTTPException(status_code=400, detail="El nombre del formato es obligatorio.")

    if archivo is None or not archivo.filename:
        raise HTTPException(status_code=400, detail="Debes seleccionar un archivo.")

    id_convocatoria_valor: int | None = None
    if id_convocatoria not in (None, ""):
        try:
            id_convocatoria_valor = int(id_convocatoria)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="La convocatoria seleccionada no es valida.") from None

        convocatoria_existe = (
            db.query(ConvocatoriaModel.id_convocatoria)
            .filter(ConvocatoriaModel.id_convocatoria == id_convocatoria_valor)
            .first()
        )
        if convocatoria_existe is None:
            raise HTTPException(status_code=400, detail="La convocatoria seleccionada no es valida.")

    contenido = archivo.file.read()
    validar_documento_liberacion(contenido, archivo.filename, getattr(archivo, "content_type", None))
    archivo.file.seek(0)
    nombre_seguro = normalizar_nombre_archivo(archivo.filename, "formato_plan_trabajo.pdf")
    carpeta = UPLOAD_FORMATOS_PLAN_DIR / (f"convocatoria_{id_convocatoria_valor}" if id_convocatoria_valor else "general")
    carpeta.mkdir(parents=True, exist_ok=True)
    ruta = carpeta / f"{secrets.token_hex(12)}_{nombre_seguro}"
    ruta.write_bytes(contenido)
    anteriores_query = db.query(FormatoPlanTrabajoVacanteModel).filter(
        FormatoPlanTrabajoVacanteModel.activo.is_(True)
    )
    if id_convocatoria_valor is None:
        anteriores_query = anteriores_query.filter(FormatoPlanTrabajoVacanteModel.id_convocatoria.is_(None))
    else:
        anteriores_query = anteriores_query.filter(
            FormatoPlanTrabajoVacanteModel.id_convocatoria == id_convocatoria_valor
        )
    anteriores_query.update(
        {FormatoPlanTrabajoVacanteModel.activo: False},
        synchronize_session=False,
    )
    formato = FormatoPlanTrabajoVacanteModel(
        id_convocatoria=id_convocatoria_valor,
        nombre=nombre_limpio,
        descripcion=descripcion.strip() if descripcion else None,
        nombre_archivo=nombre_seguro,
        ruta_archivo=str(ruta),
        activo=True,
        subido_por=usuario_actual.id_usuario,
    )
    db.add(formato)
    db.commit()
    db.refresh(formato)
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Reemplazar formato de Plan de Trabajo",
        "vacantes",
        (
            f"Formato oficial {formato.id_formato_plan} activado para "
            f"{'uso general' if formato.id_convocatoria is None else f'convocatoria {formato.id_convocatoria}'}."
        ),
        "formato_plan_trabajo_vacante",
        formato.id_formato_plan,
    )
    return _formato_plan_response(formato)


@vacantes_router.patch("/formatos-plan-trabajo/{id_formato_plan:int}/activar")
def activar_formato_plan_trabajo(id_formato_plan: int, db: Session = Depends(obtener_db)):
    formato = db.query(FormatoPlanTrabajoVacanteModel).filter(FormatoPlanTrabajoVacanteModel.id_formato_plan == id_formato_plan).first()
    if formato is None:
        raise HTTPException(status_code=404, detail="Formato no encontrado")
    activos_query = db.query(FormatoPlanTrabajoVacanteModel).filter(
        FormatoPlanTrabajoVacanteModel.activo.is_(True),
        FormatoPlanTrabajoVacanteModel.id_formato_plan != formato.id_formato_plan,
    )
    if formato.id_convocatoria is None:
        activos_query = activos_query.filter(FormatoPlanTrabajoVacanteModel.id_convocatoria.is_(None))
    else:
        activos_query = activos_query.filter(
            FormatoPlanTrabajoVacanteModel.id_convocatoria == formato.id_convocatoria
        )
    activos_query.update(
        {FormatoPlanTrabajoVacanteModel.activo: False},
        synchronize_session=False,
    )
    formato.activo = True
    db.commit()
    return _formato_plan_response(formato)


@vacantes_router.patch("/formatos-plan-trabajo/{id_formato_plan:int}/desactivar")
def desactivar_formato_plan_trabajo(id_formato_plan: int, db: Session = Depends(obtener_db)):
    formato = db.query(FormatoPlanTrabajoVacanteModel).filter(FormatoPlanTrabajoVacanteModel.id_formato_plan == id_formato_plan).first()
    if formato is None:
        raise HTTPException(status_code=404, detail="Formato no encontrado")
    formato.activo = False
    db.commit()
    return _formato_plan_response(formato)


@vacantes_router.get("/formatos-plan-trabajo/{id_formato_plan:int}/archivo")
def descargar_formato_plan_trabajo_coord(id_formato_plan: int, db: Session = Depends(obtener_db)):
    formato = (
        db.query(FormatoPlanTrabajoVacanteModel)
        .filter(
            FormatoPlanTrabajoVacanteModel.id_formato_plan == id_formato_plan,
            FormatoPlanTrabajoVacanteModel.activo.is_(True),
        )
        .first()
    )
    if formato is None:
        raise HTTPException(status_code=404, detail="Formato no encontrado")
    ruta = resolver_archivo_en_uploads(formato.ruta_archivo, UPLOADS_DIR)
    nombre = nombre_descarga_seguro(formato.nombre_archivo, "formato_plan_trabajo.pdf")
    media_type = mimetypes.guess_type(nombre)[0] or "application/octet-stream"
    return FileResponse(ruta, media_type=media_type, filename=nombre)


@router.get("/dashboard")
def obtener_dashboard_coord_unidades(db: Session = Depends(obtener_db)):
    hoy = date.today()
    limite_vencimiento = hoy + timedelta(days=30)

    solicitudes_nuevas = db.query(EmpresaModel).filter(EmpresaModel.estado_empresa == "Solicitante").count()
    empresas_pendientes = db.query(EmpresaModel).filter(EmpresaModel.estado_empresa == "Pendiente").count()
    empresas_rechazadas = db.query(EmpresaModel).filter(EmpresaModel.estado_empresa == "Rechazada").count()
    empresas_activas = db.query(EmpresaModel).filter(EmpresaModel.estado_empresa == "Activa").count()
    documentos_pendientes = db.query(DocumentoEmpresaModel).filter(
        DocumentoEmpresaModel.estado_documento == "Pendiente"
    ).count()
    convenios_vigentes = db.query(ConvenioModel).filter(
        ConvenioModel.es_actual.is_(True),
        ConvenioModel.estado_convenio == "Vigente",
        ConvenioModel.fecha_inicio <= hoy,
        ConvenioModel.fecha_fin >= hoy,
    ).count()
    convenios_por_vencer = db.query(ConvenioModel).filter(
        ConvenioModel.es_actual.is_(True),
        ConvenioModel.fecha_fin >= hoy,
        ConvenioModel.fecha_fin <= limite_vencimiento,
    ).count()
    vacantes_activas = db.query(VacanteModel).filter(VacanteModel.estado_vacante == "Activa").count()
    vacantes_pendientes = db.query(VacanteModel).filter(VacanteModel.estado_vacante == "Pendiente").count()
    vacantes_prepadron = db.query(VacanteModel).filter(VacanteModel.estado_vacante == "PrePadron").count()
    cupos_ocupados = (
        db.query(AsignacionModel)
        .filter(AsignacionModel.estado_asignacion == "Activa")
        .count()
    )
    vacantes_publicables = (
        db.query(VacanteModel)
        .join(EmpresaModel, EmpresaModel.id_empresa == VacanteModel.id_empresa)
        .join(ConvenioModel, ConvenioModel.id_empresa == EmpresaModel.id_empresa)
        .filter(
            EmpresaModel.estado_empresa == "Activa",
            ConvenioModel.es_actual.is_(True),
            ConvenioModel.estado_convenio == "Vigente",
            ConvenioModel.fecha_inicio <= hoy,
            ConvenioModel.fecha_fin >= hoy,
            VacanteModel.estado_vacante == "Activa",
        )
        .count()
    )

    actividad = (
        db.query(BitacoraAuditoriaModel)
        .filter(BitacoraAuditoriaModel.entidad.in_(["empresa", "documento_empresa", "vacante", "convenio"]))
        .order_by(BitacoraAuditoriaModel.fecha.desc())
        .limit(6)
        .all()
    )

    alertas = []
    if documentos_pendientes:
        alertas.append(f"{documentos_pendientes} documento(s) de empresa esperan revisión.")
    if convenios_por_vencer:
        alertas.append(f"{convenios_por_vencer} convenio(s) vencen en los proximos 30 dias.")
    if empresas_pendientes:
        alertas.append(f"{empresas_pendientes} empresa(s) esperan validacion para entrar al padron.")
    if vacantes_activas != vacantes_publicables:
        alertas.append("Hay vacantes activas que aun no son publicables por estado de empresa, convenio o cupo.")

    return {
        "resumen": {
            "empresas_pendientes": empresas_pendientes,
            "solicitudes_nuevas": solicitudes_nuevas,
            "empresas_rechazadas": empresas_rechazadas,
            "documentos_pendientes": documentos_pendientes,
            "convenios_pendientes": db.query(ConvenioModel).filter(ConvenioModel.estado_convenio == "Pendiente").count(),
            "vacantes_pendientes": vacantes_pendientes,
            "vacantes_prepadron": vacantes_prepadron,
            "vacantes_activas": vacantes_activas,
            "vacantes_publicables": vacantes_publicables,
            "cupos_ocupados": cupos_ocupados,
            "empresas_publicadas": empresas_activas,
            "convenios_por_vencer": convenios_por_vencer,
        },
        "pipeline": [
            {
                "etapa": "Empresas registradas",
                "cantidad": solicitudes_nuevas,
                "detalle": "Solicitudes recibidas",
            },
            {
                "etapa": "Documentacion validada",
                "cantidad": db.query(func.count(func.distinct(DocumentoEmpresaModel.id_empresa))).filter(
                    DocumentoEmpresaModel.estado_documento == "Aprobado"
                ).scalar() or 0,
                "detalle": "Empresas con documentos aprobados",
            },
            {
                "etapa": "Convenios vigentes",
                "cantidad": convenios_vigentes,
                "detalle": "Empresas habilitadas por convenio",
            },
            {
                "etapa": "Vacantes activas",
                "cantidad": vacantes_prepadron,
                "detalle": "Vacantes revisadas aun no visibles para alumnos",
            },
            {
                "etapa": "Publicadas en padron",
                "cantidad": vacantes_publicables,
                "detalle": "Vacantes visibles para alumnos",
            },
        ],
        "actividad": [
            {
                "id_bitacora": item.id_bitacora,
                "texto": f"{item.accion} en {item.modulo}",
                "detalle": item.descripcion,
                "fecha": item.fecha.isoformat() if item.fecha else None,
            }
            for item in actividad
        ],
        "alertas": alertas,
    }


@router.get("/")
def listar_empresas_revision(db: Session = Depends(obtener_db)):
    empresas = db.query(EmpresaModel).order_by(EmpresaModel.id_empresa.desc()).all()

    resultado = []
    for empresa in empresas:
        solicitud = _ultima_solicitud(db, empresa.id_empresa)
        usuario = _usuario_empresa(db, empresa.id_empresa)
        resultado.append({
            "id_empresa": empresa.id_empresa,
            "nombre_empresa": empresa.nombre_empresa,
            "rfc": empresa.rfc,
            "giro": empresa.giro,
            "domicilio": empresa.domicilio,
            "telefono": empresa.telefono,
            "correo_contacto": empresa.correo_contacto,
            "estado_empresa": empresa.estado_empresa,
            "tipo_tramite": empresa.tipo_tramite or (solicitud.tipo_tramite_solicitado if solicitud else None),
            "estado_solicitud": solicitud.estado_solicitud if solicitud else None,
            "motivo_rechazo": solicitud.motivo_rechazo if solicitud else None,
            "cuenta_creada": usuario is not None,
            "correo_usuario": usuario.correo if usuario else None,
            "vacantes": db.query(VacanteModel)
            .filter(VacanteModel.id_empresa == empresa.id_empresa)
            .count(),
            "vacantes_activas": db.query(VacanteModel)
            .filter(
                VacanteModel.id_empresa == empresa.id_empresa,
                VacanteModel.estado_vacante == "Activa",
            )
            .count(),
            "padron": "Publicado" if _empresa_publicable(db, empresa) else "No publicado",
        })
    return resultado


@router.get("/{id_empresa}/solicitud")
def obtener_solicitud_empresa(id_empresa: int, db: Session = Depends(obtener_db)):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    solicitud = _ultima_solicitud(db, id_empresa)
    usuario = _usuario_empresa(db, id_empresa)
    return {
        "empresa": {
            "id_empresa": empresa.id_empresa,
            "nombre_empresa": empresa.nombre_empresa,
            "rfc": empresa.rfc,
            "giro": empresa.giro,
            "domicilio": empresa.domicilio,
            "telefono": empresa.telefono,
            "correo_contacto": empresa.correo_contacto,
            "estado_empresa": empresa.estado_empresa,
        },
        "solicitud": {
            "id_solicitud_empresa": solicitud.id_solicitud_empresa if solicitud else None,
            "tipo_tramite": solicitud.tipo_tramite_solicitado if solicitud else empresa.tipo_tramite,
            "estado_solicitud": solicitud.estado_solicitud if solicitud else None,
            "motivo_rechazo": solicitud.motivo_rechazo if solicitud else None,
            "observaciones": solicitud.observaciones if solicitud else None,
            "fecha_solicitud": solicitud.fecha_solicitud.isoformat() if solicitud and solicitud.fecha_solicitud else None,
            "fecha_revision": solicitud.fecha_revision.isoformat() if solicitud and solicitud.fecha_revision else None,
        },
        "cuenta_creada": usuario is not None,
        "correo_usuario": usuario.correo if usuario else None,
    }


@router.post("/{id_empresa}/aceptar-solicitud")
def aceptar_solicitud_empresa(
    id_empresa: int,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    if not empresa.correo_contacto:
        raise HTTPException(status_code=400, detail="La empresa no tiene correo de contacto")

    solicitud = _ultima_solicitud(db, id_empresa)
    if empresa.estado_empresa != "Solicitante" and _usuario_empresa(db, id_empresa) is not None:
        return {
            "mensaje": "La empresa ya tiene cuenta creada",
            "cuenta_creada": False,
            "correo": _usuario_empresa(db, id_empresa).correo,
            "correo_enviado": False,
            "advertencia_correo": None,
            "password_temporal": None,
        }

    rol = db.query(RolModel).filter(RolModel.nombre == "Unidad Receptora").first()
    if rol is None:
        rol = db.query(RolModel).filter(RolModel.id_rol == 5).first()
    if rol is None:
        raise HTTPException(status_code=400, detail="No existe el rol Unidad Receptora")

    correo = empresa.correo_contacto.strip().lower()
    responsable = (
        db.query(ResponsableEmpresaModel)
        .filter(ResponsableEmpresaModel.id_empresa == id_empresa)
        .order_by(ResponsableEmpresaModel.id_responsable.desc())
        .first()
    )
    nombre_contacto = (
        " ".join(
            parte
            for parte in [
                responsable.nombre if responsable else None,
                responsable.apellido_paterno if responsable else None,
                responsable.apellido_materno if responsable else None,
            ]
            if parte
        )
        or "Responsable"
    )
    cargo_contacto = responsable.cargo if responsable else None
    usuario = db.query(UsuarioModel).filter(UsuarioModel.correo == correo).first()
    password_temporal = None
    cuenta_creada = False

    if usuario is None:
        password_temporal = _generar_password_temporal()
        usuario = UsuarioModel(
            id_rol=rol.id_rol,
            correo=correo,
            password_hash=generar_password_hash(password_temporal),
            debe_cambiar_password=True,
            estado="Activo",
        )
        db.add(usuario)
        db.flush()
        cuenta_creada = True
    elif usuario.id_rol != rol.id_rol:
        raise HTTPException(status_code=400, detail="Ya existe un usuario con ese correo y otro rol")

    responsable_existente = (
        db.query(ResponsableEmpresaModel)
        .filter(ResponsableEmpresaModel.id_usuario == usuario.id_usuario)
        .first()
    )
    if responsable_existente and responsable_existente.id_empresa != id_empresa:
        raise HTTPException(status_code=400, detail="Ese correo ya esta ligado a otra empresa")
    if responsable_existente is None:
        if responsable is None:
            db.add(ResponsableEmpresaModel(
                id_empresa=id_empresa,
                id_usuario=usuario.id_usuario,
                nombre="Responsable",
                apellido_paterno="Empresa",
                apellido_materno=None,
                cargo=cargo_contacto,
                telefono=empresa.telefono,
                correo=correo,
            ))
        else:
            responsable.id_usuario = usuario.id_usuario
            responsable.correo = responsable.correo or correo
            responsable.telefono = responsable.telefono or empresa.telefono

    empresa.estado_empresa = "Pendiente"
    if solicitud:
        empresa.tipo_tramite = solicitud.tipo_tramite_solicitado
        solicitud.estado_solicitud = "Aceptada"
        solicitud.fecha_revision = func.now()
        solicitud.revisada_por = usuario_actual.id_usuario

    db.commit()
    correo_enviado = False
    advertencia_correo = None
    if cuenta_creada and password_temporal:
        resultado_correo = enviar_correo_empresa_aceptada(
            destinatario=correo,
            nombre_responsable=nombre_contacto,
            nombre_empresa=empresa.nombre_empresa,
            correo_acceso=correo,
            password_temporal=password_temporal,
        )
        correo_enviado = resultado_correo.enviado
        advertencia_correo = resultado_correo.advertencia
        if resultado_correo.enviado:
            correo_enviado = True
            registrar_bitacora(
                db,
                usuario_actual.id_usuario,
                "envio_correo_empresa_aceptada",
                "coord_unidades_empresas",
                f"Se enviaron credenciales de acceso a la empresa {empresa.nombre_empresa}.",
                "empresa",
                empresa.id_empresa,
            )
        else:
            accion_correo = "correo_deshabilitado" if "deshabilitado" in (resultado_correo.error or "").lower() else "error_envio_correo"
            registrar_bitacora(
                db,
                usuario_actual.id_usuario,
                accion_correo,
                "coord_unidades_empresas",
                f"No se pudieron enviar credenciales de acceso a la empresa {empresa.nombre_empresa}: {resultado_correo.error}.",
                "empresa",
                empresa.id_empresa,
            )
    return {
        "mensaje": "Solicitud aceptada. La empresa ya puede iniciar sesion y subir documentos.",
        "cuenta_creada": cuenta_creada,
        "correo": correo,
        "correo_enviado": correo_enviado,
        "advertencia_correo": advertencia_correo,
        "password_temporal": password_temporal if mostrar_password_temporal_en_respuesta() else None,
    }


@router.post("/{id_empresa}/rechazar-solicitud")
def rechazar_solicitud_empresa(
    id_empresa: int,
    datos: RechazarSolicitudRequest,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    if not datos.motivo_rechazo.strip():
        raise HTTPException(status_code=400, detail="El motivo de rechazo es obligatorio")

    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    if _usuario_empresa(db, id_empresa) is not None:
        raise HTTPException(status_code=400, detail="No se puede rechazar una empresa que ya tiene cuenta")

    solicitud = _ultima_solicitud(db, id_empresa)
    empresa.estado_empresa = "Rechazada"
    if solicitud:
        solicitud.estado_solicitud = "Rechazada"
        solicitud.motivo_rechazo = datos.motivo_rechazo.strip()
        solicitud.observaciones = datos.observaciones
        solicitud.fecha_revision = func.now()
        solicitud.revisada_por = usuario_actual.id_usuario

    db.commit()
    correo_destino = (empresa.correo_contacto or "").strip().lower()
    correo_enviado = False
    advertencia_correo = None
    if correo_destino:
        resultado_correo = enviar_correo_empresa_rechazada(
            destinatario=correo_destino,
            nombre_empresa=empresa.nombre_empresa,
            motivo_rechazo=datos.motivo_rechazo.strip(),
            observaciones=datos.observaciones,
        )
        correo_enviado = resultado_correo.enviado
        advertencia_correo = resultado_correo.advertencia
        if resultado_correo.enviado:
            registrar_bitacora(
                db,
                usuario_actual.id_usuario,
                "envio_correo_empresa_rechazada",
                "coord_unidades_empresas",
                f"Se envi? aviso de rechazo a la empresa {empresa.nombre_empresa}.",
                "empresa",
                empresa.id_empresa,
            )
        else:
            accion_correo = "correo_deshabilitado" if "deshabilitado" in (resultado_correo.error or "").lower() else "error_envio_correo"
            registrar_bitacora(
                db,
                usuario_actual.id_usuario,
                accion_correo,
                "coord_unidades_empresas",
                f"No se pudo enviar aviso de rechazo a la empresa {empresa.nombre_empresa}: {resultado_correo.error}.",
                "empresa",
                empresa.id_empresa,
            )
    else:
        advertencia_correo = "La empresa fue rechazada, pero no tiene correo de contacto registrado."
        registrar_bitacora(
            db,
            usuario_actual.id_usuario,
            "correo_deshabilitado",
            "coord_unidades_empresas",
            f"No se envi? aviso de rechazo a la empresa {empresa.nombre_empresa} porque no tiene correo de contacto.",
            "empresa",
            empresa.id_empresa,
        )
    return {
        "mensaje": "Solicitud rechazada",
        "estado_empresa": empresa.estado_empresa,
        "correo_enviado": correo_enviado,
        "advertencia_correo": advertencia_correo,
    }


@router.get("/participaciones/")
def listar_participaciones_empresa(db: Session = Depends(obtener_db)):
    participaciones = (
        db.query(ParticipacionEmpresaConvocatoriaModel)
        .order_by(ParticipacionEmpresaConvocatoriaModel.id_participacion.desc())
        .all()
    )
    return [
        {
            "id_participacion": item.id_participacion,
            "id_empresa": item.id_empresa,
            "empresa": item.empresa.nombre_empresa if item.empresa else None,
            "id_convocatoria": item.id_convocatoria,
            "convocatoria": item.convocatoria.nombre if item.convocatoria else None,
            "tipo_periodo": item.convocatoria.tipo_periodo if item.convocatoria else None,
            "estado": item.estado,
            "fecha_solicitud": item.fecha_solicitud.isoformat() if item.fecha_solicitud else None,
            "fecha_revision": item.fecha_revision.isoformat() if item.fecha_revision else None,
            "observaciones": item.observaciones,
            "motivo_rechazo": item.motivo_rechazo,
        }
        for item in participaciones
    ]


@router.patch("/participaciones/{id_participacion}")
def revisar_participacion_empresa(
    id_participacion: int,
    datos: RevisarParticipacionRequest,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    if datos.estado not in {"Aceptada", "Rechazada", "Cerrada"}:
        raise HTTPException(status_code=400, detail="Estado de participacion no valido")
    if datos.estado == "Rechazada" and not (datos.motivo_rechazo or "").strip():
        raise HTTPException(status_code=400, detail="El motivo de rechazo es obligatorio")
    participacion = (
        db.query(ParticipacionEmpresaConvocatoriaModel)
        .filter(ParticipacionEmpresaConvocatoriaModel.id_participacion == id_participacion)
        .first()
    )
    if participacion is None:
        raise HTTPException(status_code=404, detail="Participacion no encontrada")
    participacion.estado = datos.estado
    participacion.observaciones = datos.observaciones
    participacion.motivo_rechazo = datos.motivo_rechazo
    participacion.fecha_revision = func.now()
    participacion.revisada_por = usuario_actual.id_usuario
    db.commit()
    return {"mensaje": "Participacion actualizada", "estado": participacion.estado}


@router.get("/vacantes/")
def listar_vacantes_revision(db: Session = Depends(obtener_db)):
    tipos_practica = {
        row.id_tipo_practica: row.nombre
        for row in db.execute(
            text("SELECT id_tipo_practica, nombre FROM tipo_practica")
        ).all()
    }
    vacantes = db.query(VacanteModel).order_by(VacanteModel.id_vacante.desc()).all()

    return [
        {
            "id_vacante": vacante.id_vacante,
            "id_empresa": vacante.id_empresa,
            "empresa": vacante.empresa.nombre_empresa,
            "estado_empresa": vacante.empresa.estado_empresa,
            "titulo": vacante.titulo,
            "descripcion": vacante.descripcion,
            "actividades": vacante.actividades,
            "requisitos": vacante.requisitos,
            "cupos": vacante.cupos,
            "aplica_todas_carreras": bool(vacante.aplica_todas_carreras),
            "carreras": [
                {
                    "id_carrera": carrera.id_carrera,
                    "nombre": carrera.carrera.nombre if carrera.carrera else "Carrera sin nombre",
                }
                for carrera in db.query(VacanteCarreraModel)
                .filter(VacanteCarreraModel.id_vacante == vacante.id_vacante)
                .all()
            ],
            "tipos_practica": [
                {
                    "id_tipo_practica": tipo.id_tipo_practica,
                    "nombre": tipo.tipo_practica.nombre if tipo.tipo_practica else tipos_practica.get(tipo.id_tipo_practica),
                    "cupos": tipo.cupos,
                    "cupos_usados": db.query(AsignacionModel)
                    .filter(
                        AsignacionModel.id_vacante == vacante.id_vacante,
                        AsignacionModel.id_tipo_practica == tipo.id_tipo_practica,
                        AsignacionModel.estado_asignacion == "Activa",
                    )
                    .count(),
                    "cupos_disponibles": max(
                        tipo.cupos
                        - db.query(AsignacionModel)
                        .filter(
                            AsignacionModel.id_vacante == vacante.id_vacante,
                            AsignacionModel.id_tipo_practica == tipo.id_tipo_practica,
                            AsignacionModel.estado_asignacion == "Activa",
                        )
                        .count(),
                        0,
                    ),
                }
                for tipo in db.query(VacanteTipoPracticaModel)
                .filter(
                    VacanteTipoPracticaModel.id_vacante == vacante.id_vacante,
                    VacanteTipoPracticaModel.activo.is_(True),
                )
                .all()
            ],
            "solicitudes_ampliacion": [
                {
                    "id_solicitud_ampliacion": solicitud.id_solicitud_ampliacion,
                    "id_tipo_practica": solicitud.id_tipo_practica,
                    "cupos_solicitados": solicitud.cupos_solicitados,
                    "motivo": solicitud.motivo,
                    "estado": solicitud.estado,
                    "fecha_solicitud": solicitud.fecha_solicitud,
                    "observaciones": solicitud.observaciones,
                    "detalles": _detalles_ampliacion_response(db, solicitud),
                }
                for solicitud in db.query(SolicitudAmpliacionCuposVacanteModel)
                .filter(SolicitudAmpliacionCuposVacanteModel.id_vacante == vacante.id_vacante)
                .order_by(SolicitudAmpliacionCuposVacanteModel.id_solicitud_ampliacion.desc())
                .all()
            ],
            "plan_trabajo": _plan_trabajo_vacante(db, vacante),
            "cupo_ocupado": db.query(AsignacionModel)
            .filter(
                AsignacionModel.id_vacante == vacante.id_vacante,
                AsignacionModel.id_empresa == vacante.id_empresa,
                AsignacionModel.estado_asignacion == "Activa",
            )
            .count(),
            "estado_vacante": vacante.estado_vacante,
            "observaciones": vacante.observaciones,
            "periodo": vacante.periodo,
            "id_tipo_practica": vacante.id_tipo_practica,
            "tipo_practica": tipos_practica.get(vacante.id_tipo_practica),
            "id_convocatoria": vacante.id_convocatoria,
            "convocatoria": vacante.convocatoria.nombre if vacante.convocatoria else None,
            "publicable": (
                _empresa_publicable(db, vacante.empresa)
                and vacante.estado_vacante == "Activa"
            ),
        }
        for vacante in vacantes
    ]


@router.get("/vacantes/solicitudes-ampliacion")
def listar_solicitudes_ampliacion_vacantes(db: Session = Depends(obtener_db)):
    solicitudes = (
        db.query(SolicitudAmpliacionCuposVacanteModel)
        .join(VacanteModel, VacanteModel.id_vacante == SolicitudAmpliacionCuposVacanteModel.id_vacante)
        .join(EmpresaModel, EmpresaModel.id_empresa == VacanteModel.id_empresa)
        .outerjoin(TipoPracticaModel, TipoPracticaModel.id_tipo_practica == SolicitudAmpliacionCuposVacanteModel.id_tipo_practica)
        .order_by(SolicitudAmpliacionCuposVacanteModel.fecha_solicitud.desc())
        .all()
    )
    return [
        {
            "id_solicitud_ampliacion": solicitud.id_solicitud_ampliacion,
            "id_vacante": solicitud.id_vacante,
            "vacante": solicitud.vacante.titulo if solicitud.vacante else None,
            "id_empresa": solicitud.vacante.id_empresa if solicitud.vacante else None,
            "empresa": solicitud.vacante.empresa.nombre_empresa if solicitud.vacante and solicitud.vacante.empresa else None,
            "id_tipo_practica": solicitud.id_tipo_practica,
            "tipo_practica": solicitud.tipo_practica.nombre if solicitud.tipo_practica else None,
            "cupos_solicitados": solicitud.cupos_solicitados,
            "motivo": solicitud.motivo,
            "estado": solicitud.estado,
            "fecha_solicitud": solicitud.fecha_solicitud,
            "fecha_revision": solicitud.fecha_revision,
            "observaciones": solicitud.observaciones,
            "detalles": _detalles_ampliacion_response(db, solicitud),
        }
        for solicitud in solicitudes
    ]


def _aplicar_ampliacion_cupos(db: Session, solicitud: SolicitudAmpliacionCuposVacanteModel) -> None:
    vacante = solicitud.vacante
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")

    if solicitud.detalles:
        for detalle in solicitud.detalles:
            aprobados = detalle.cupos_aprobados if detalle.cupos_aprobados is not None else detalle.cupos_solicitados
            if aprobados <= 0:
                detalle.cupos_aprobados = 0
                detalle.estado = "Rechazada"
                continue
            config = (
                db.query(VacanteTipoPracticaModel)
                .filter(
                    VacanteTipoPracticaModel.id_vacante == vacante.id_vacante,
                    VacanteTipoPracticaModel.id_tipo_practica == detalle.id_tipo_practica,
                    VacanteTipoPracticaModel.activo.is_(True),
                )
                .first()
            )
            if config is None:
                raise HTTPException(status_code=400, detail="El tipo de práctica no pertenece a esta vacante")
            detalle.cupos_aprobados = aprobados
            detalle.estado = "Aprobada"
            config.cupos += aprobados
        total = (
            db.query(func.coalesce(func.sum(VacanteTipoPracticaModel.cupos), 0))
            .filter(
                VacanteTipoPracticaModel.id_vacante == vacante.id_vacante,
                VacanteTipoPracticaModel.activo.is_(True),
            )
            .scalar()
            or vacante.cupos
        )
        vacante.cupos = int(total)
        return

    if solicitud.id_tipo_practica is not None:
        config = (
            db.query(VacanteTipoPracticaModel)
            .filter(
                VacanteTipoPracticaModel.id_vacante == vacante.id_vacante,
                VacanteTipoPracticaModel.id_tipo_practica == solicitud.id_tipo_practica,
                VacanteTipoPracticaModel.activo.is_(True),
            )
            .first()
        )
        if config is None:
            raise HTTPException(status_code=400, detail="El tipo de práctica no pertenece a esta vacante")
        config.cupos += solicitud.cupos_solicitados
    else:
        configs = (
            db.query(VacanteTipoPracticaModel)
            .filter(
                VacanteTipoPracticaModel.id_vacante == vacante.id_vacante,
                VacanteTipoPracticaModel.activo.is_(True),
            )
            .order_by(VacanteTipoPracticaModel.id_vacante_tipo_practica.asc())
            .all()
        )
        if not configs:
            configs = [
                VacanteTipoPracticaModel(
                    id_vacante=vacante.id_vacante,
                    id_tipo_practica=vacante.id_tipo_practica,
                    cupos=vacante.cupos,
                    activo=True,
                )
            ]
            db.add(configs[0])
            db.flush()
        configs[0].cupos += solicitud.cupos_solicitados

    total = (
        db.query(func.coalesce(func.sum(VacanteTipoPracticaModel.cupos), 0))
        .filter(
            VacanteTipoPracticaModel.id_vacante == vacante.id_vacante,
            VacanteTipoPracticaModel.activo.is_(True),
        )
        .scalar()
        or vacante.cupos
    )
    vacante.cupos = int(total)


def _notificar_empresa_ampliacion(db: Session, solicitud: SolicitudAmpliacionCuposVacanteModel, estado: str) -> None:
    empresa = solicitud.vacante.empresa if solicitud.vacante else None
    if empresa is None:
        return
    for responsable in empresa.responsables:
        crear_notificacion(
            db,
            responsable.id_usuario,
            f"Ampliación de cupos {estado.lower()}",
            f"Tu solicitud de ampliación para la vacante {solicitud.vacante.titulo} fue {estado.lower()}.",
        )


def _validar_vacante_publicable(db: Session, vacante: VacanteModel) -> None:
    configuraciones = (
        db.query(VacanteTipoPracticaModel)
        .join(TipoPracticaModel, TipoPracticaModel.id_tipo_practica == VacanteTipoPracticaModel.id_tipo_practica)
        .filter(
            VacanteTipoPracticaModel.id_vacante == vacante.id_vacante,
            VacanteTipoPracticaModel.activo.is_(True),
            TipoPracticaModel.activo.is_(True),
        )
        .all()
    )
    if not configuraciones or any(config.cupos <= 0 for config in configuraciones):
        raise HTTPException(status_code=400, detail="La vacante debe tener tipos de práctica activos con cupos válidos.")
    if vacante.convocatoria is None:
        raise HTTPException(status_code=400, detail="La vacante no tiene una convocatoria válida.")
    carreras_compatibles = (
        db.query(CarreraModel.id_carrera)
        .filter(
            CarreraModel.estado == "Activa",
            CarreraModel.tipo_periodo == vacante.convocatoria.tipo_periodo,
        )
        .all()
    )
    ids_compatibles = {id_carrera for (id_carrera,) in carreras_compatibles}
    if not ids_compatibles:
        raise HTTPException(status_code=400, detail="No existen carreras activas compatibles con la convocatoria.")
    if not vacante.aplica_todas_carreras:
        ids_configurados = {
            id_carrera
            for (id_carrera,) in (
                db.query(VacanteCarreraModel.id_carrera)
                .filter(VacanteCarreraModel.id_vacante == vacante.id_vacante)
                .all()
            )
        }
        if not ids_configurados or not ids_configurados.issubset(ids_compatibles):
            raise HTTPException(status_code=400, detail="La vacante debe tener carreras activas compatibles con la convocatoria.")


@router.post("/vacantes/solicitudes-ampliacion/{id_solicitud:int}/aprobar")
def aprobar_solicitud_ampliacion_vacante(
    id_solicitud: int,
    datos: RevisarAmpliacionCuposDetalleRequest | None = None,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    solicitud = (
        db.query(SolicitudAmpliacionCuposVacanteModel)
        .filter(SolicitudAmpliacionCuposVacanteModel.id_solicitud_ampliacion == id_solicitud)
        .first()
    )
    if solicitud is None:
        raise HTTPException(status_code=404, detail="Solicitud de ampliación no encontrada")
    if solicitud.estado != "Pendiente":
        raise HTTPException(status_code=400, detail="La solicitud ya fue revisada")

    if solicitud.detalles and datos and datos.cupos_aprobados:
        por_tipo = {int(id_tipo): cupos for id_tipo, cupos in datos.cupos_aprobados.items()}
        for detalle in solicitud.detalles:
            aprobados = int(por_tipo.get(detalle.id_tipo_practica, 0))
            if aprobados < 0 or aprobados > detalle.cupos_solicitados:
                raise HTTPException(status_code=400, detail="Los cupos aprobados deben estar entre 0 y los solicitados.")
            detalle.cupos_aprobados = aprobados
    _aplicar_ampliacion_cupos(db, solicitud)
    solicitud.estado = "Aprobada" if any((detalle.cupos_aprobados or 0) > 0 for detalle in solicitud.detalles) or not solicitud.detalles else "Rechazada"
    solicitud.fecha_revision = datetime.now()
    solicitud.revisada_por = usuario_actual.id_usuario
    solicitud.observaciones = datos.observaciones if datos else None
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Aprobar ampliación de cupos",
        "vacantes",
        f"Solicitud {id_solicitud} aprobada.",
        "solicitud_ampliacion_cupos_vacante",
        id_solicitud,
    )
    _notificar_empresa_ampliacion(db, solicitud, solicitud.estado)
    db.commit()
    return {"mensaje": "Solicitud aprobada", "estado": solicitud.estado}


@router.post("/vacantes/solicitudes-ampliacion/{id_solicitud:int}/rechazar")
def rechazar_solicitud_ampliacion_vacante(
    id_solicitud: int,
    datos: RevisarAmpliacionCuposRequest | None = None,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    solicitud = (
        db.query(SolicitudAmpliacionCuposVacanteModel)
        .filter(SolicitudAmpliacionCuposVacanteModel.id_solicitud_ampliacion == id_solicitud)
        .first()
    )
    if solicitud is None:
        raise HTTPException(status_code=404, detail="Solicitud de ampliación no encontrada")
    if solicitud.estado != "Pendiente":
        raise HTTPException(status_code=400, detail="La solicitud ya fue revisada")
    observaciones = " ".join(((datos.observaciones if datos else None) or "").split())
    if len(observaciones) < 3:
        raise HTTPException(status_code=422, detail="El motivo del rechazo es obligatorio")
    solicitud.estado = "Rechazada"
    solicitud.fecha_revision = datetime.now()
    solicitud.revisada_por = usuario_actual.id_usuario
    solicitud.observaciones = observaciones
    for detalle in solicitud.detalles:
        detalle.estado = "Rechazada"
        detalle.cupos_aprobados = 0
        detalle.observaciones = solicitud.observaciones
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Rechazar ampliación de cupos",
        "vacantes",
        f"Solicitud {id_solicitud} rechazada.",
        "solicitud_ampliacion_cupos_vacante",
        id_solicitud,
    )
    _notificar_empresa_ampliacion(db, solicitud, "Rechazada")
    db.commit()
    return {"mensaje": "Solicitud rechazada", "estado": solicitud.estado}


@router.get("/vacantes/{id_vacante:int}/detalle")
def obtener_detalle_vacante_coord(id_vacante: int, db: Session = Depends(obtener_db)):
    vacante = db.query(VacanteModel).filter(VacanteModel.id_vacante == id_vacante).first()
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")
    return {
        "id_vacante": vacante.id_vacante,
        "id_empresa": vacante.id_empresa,
        "empresa": vacante.empresa.nombre_empresa if vacante.empresa else None,
        "titulo": vacante.titulo,
        "descripcion": vacante.descripcion,
        "actividades": vacante.actividades,
        "requisitos": vacante.requisitos,
        "cupos": vacante.cupos,
        "aplica_todas_carreras": bool(vacante.aplica_todas_carreras),
        "carreras": [
            {"id_carrera": item.id_carrera, "nombre": item.carrera.nombre if item.carrera else "Carrera sin nombre"}
            for item in vacante.carreras_config
        ],
        "tipos_practica": [
            {
                "id_tipo_practica": item.id_tipo_practica,
                "nombre": item.tipo_practica.nombre if item.tipo_practica else None,
                "cupos": item.cupos,
                "activo": bool(item.activo),
            }
            for item in vacante.tipos_practica_config
            if item.activo
        ],
        "solicitudes_ampliacion": [
            {
                "id_solicitud_ampliacion": solicitud.id_solicitud_ampliacion,
                "id_tipo_practica": solicitud.id_tipo_practica,
                "cupos_solicitados": solicitud.cupos_solicitados,
                "motivo": solicitud.motivo,
                "estado": solicitud.estado,
                "fecha_solicitud": solicitud.fecha_solicitud.isoformat() if solicitud.fecha_solicitud else None,
                "observaciones": solicitud.observaciones,
            }
            for solicitud in vacante.solicitudes_ampliacion
        ],
        "estado_vacante": vacante.estado_vacante,
        "periodo": vacante.periodo,
        "id_convocatoria": vacante.id_convocatoria,
        "convocatoria": vacante.convocatoria.nombre if vacante.convocatoria else None,
        "observaciones": vacante.observaciones,
        "fecha_revision": vacante.fecha_revision.isoformat() if vacante.fecha_revision else None,
        "revisada_por": vacante.revisada_por,
        "plan_trabajo": _plan_trabajo_vacante(db, vacante),
    }


@router.get("/vacantes/{id_vacante:int}/plan-trabajo/archivo")
def descargar_plan_trabajo_vacante_coord(id_vacante: int, db: Session = Depends(obtener_db)):
    vacante = db.query(VacanteModel).filter(VacanteModel.id_vacante == id_vacante).first()
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")
    documento = (
        db.query(DocumentoVacanteModel)
        .filter(
            DocumentoVacanteModel.id_vacante == id_vacante,
            DocumentoVacanteModel.tipo_documento == "Plan de trabajo",
            DocumentoVacanteModel.activo.is_(True),
        )
        .order_by(DocumentoVacanteModel.id_documento_vacante.desc())
        .first()
    )
    if documento is None:
        raise HTTPException(status_code=404, detail="Plan de Trabajo no encontrado")
    ruta = resolver_archivo_en_uploads(documento.ruta_archivo, UPLOADS_DIR)
    nombre = nombre_descarga_seguro(documento.nombre_archivo, "plan_trabajo.pdf")
    media_type = mimetypes.guess_type(nombre)[0] or "application/octet-stream"
    return FileResponse(ruta, media_type=media_type, filename=nombre)


@router.patch("/vacantes/{id_vacante}/estado")
def cambiar_estado_vacante(
    id_vacante: int,
    datos: CambiarEstadoVacanteRequest,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    estados_validos = {"Pendiente", "Con observaciones", "PrePadron", "Activa", "Rechazada", "Cerrada"}
    if datos.estado_vacante not in estados_validos:
        raise HTTPException(status_code=400, detail="Estado de vacante no valido")

    vacante = db.query(VacanteModel).filter(VacanteModel.id_vacante == id_vacante).first()
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada")

    transiciones = {
        "Pendiente": {"PrePadron", "Con observaciones", "Rechazada"},
        "Con observaciones": {"Pendiente", "Rechazada"},
        "PrePadron": {"Activa", "Con observaciones"},
        "Activa": {"Cerrada"},
        "Rechazada": set(),
        "Cerrada": set(),
    }
    if datos.estado_vacante not in transiciones.get(vacante.estado_vacante, set()):
        raise HTTPException(status_code=400, detail="Transicion de vacante no permitida")
    if datos.estado_vacante in {"Con observaciones", "Rechazada"} and not (datos.observaciones or "").strip():
        raise HTTPException(status_code=422, detail="El motivo u observación es obligatorio")

    if datos.estado_vacante == "PrePadron":
        if _plan_trabajo_vacante(db, vacante) is None:
            raise HTTPException(status_code=400, detail="La vacante no tiene Plan de Trabajo cargado.")
        validar_etapa_actual(vacante.convocatoria, "empresas")
        validar_habilitacion_empresa_para_vacantes(db, vacante.empresa)
        _validar_vacante_publicable(db, vacante)
    if datos.estado_vacante == "Activa":
        raise HTTPException(status_code=400, detail="La liberacion a Activa se realiza desde Padron Empresarial.")

    vacante.estado_vacante = datos.estado_vacante
    vacante.observaciones = datos.observaciones
    vacante.fecha_revision = datetime.now()
    vacante.revisada_por = usuario_actual.id_usuario
    db.flush()
    for responsable in (vacante.empresa.responsables if vacante.empresa else []):
        crear_notificacion(
            db,
            responsable.id_usuario,
            "Vacante revisada",
            f"Tu vacante {vacante.titulo} cambió a estado {datos.estado_vacante}.",
        )
    db.commit()
    db.refresh(vacante)
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        f"Cambiar vacante a {datos.estado_vacante}",
        "vacantes",
        f"Vacante {vacante.id_vacante} actualizada a {datos.estado_vacante}.",
        "vacante",
        vacante.id_vacante,
    )
    return {"mensaje": "Estado de vacante actualizado", "estado_vacante": vacante.estado_vacante}


@router.post("/vacantes/liberar-prepadron")
def liberar_prepadron(
    filtros: LiberarPrepadronRequest | None = None,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    filtros = filtros or LiberarPrepadronRequest()
    query = db.query(VacanteModel).filter(VacanteModel.estado_vacante == "PrePadron")
    if filtros.id_convocatoria is not None:
        query = query.filter(VacanteModel.id_convocatoria == filtros.id_convocatoria)
    if filtros.id_tipo_practica is not None:
        query = (
            query.join(
                VacanteTipoPracticaModel,
                VacanteTipoPracticaModel.id_vacante == VacanteModel.id_vacante,
            )
            .filter(
                VacanteTipoPracticaModel.id_tipo_practica == filtros.id_tipo_practica,
                VacanteTipoPracticaModel.activo.is_(True),
            )
            .distinct()
        )

    vacantes = query.all()
    liberadas = 0
    ids_liberadas: list[int] = []
    for vacante in vacantes:
        if (
            vacante.empresa.estado_empresa == "Activa"
        ):
            try:
                validar_etapa_actual(vacante.convocatoria, "empresas")
                validar_habilitacion_empresa_para_vacantes(db, vacante.empresa)
                _validar_vacante_publicable(db, vacante)
                vacante.estado_vacante = "Activa"
                vacante.fecha_revision = datetime.now()
                vacante.revisada_por = usuario_actual.id_usuario
                for responsable in vacante.empresa.responsables:
                    crear_notificacion(
                        db,
                        responsable.id_usuario,
                        "Vacante publicada",
                        f"Tu vacante {vacante.titulo} fue publicada en el padrón empresarial.",
                    )
                liberadas += 1
                ids_liberadas.append(vacante.id_vacante)
            except HTTPException:
                continue
    db.commit()
    for id_vacante in ids_liberadas:
        registrar_bitacora(
            db,
            usuario_actual.id_usuario,
            "Publicar vacante",
            "vacantes",
            f"Vacante {id_vacante} liberada de PrePadron a Activa.",
            "vacante",
            id_vacante,
        )
    return {"mensaje": "Pre-padron liberado", "vacantes_liberadas": liberadas}


@router.patch("/{id_empresa}/estado")
def cambiar_estado_empresa(
    id_empresa: int,
    datos: CambiarEstadoEmpresaRequest,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    estados_validos = {"Solicitante", "Pendiente", "Rechazada", "Activa", "Suspendida", "Inactiva"}
    if datos.estado_empresa not in estados_validos:
        raise HTTPException(status_code=400, detail="Estado de empresa no válido")

    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    estado_anterior = empresa.estado_empresa
    if estado_anterior == "Rechazada" and datos.estado_empresa != "Rechazada":
        if datos.estado_empresa != "Pendiente":
            raise HTTPException(status_code=400, detail="Una empresa rechazada solo puede volver a Pendiente")
        solicitud = _ultima_solicitud(db, id_empresa)
        if solicitud is None or solicitud.estado_solicitud != "Rechazada" or solicitud.fecha_revision is None:
            raise HTTPException(status_code=400, detail="No hay rechazo reciente para deshacer")
        if datetime.now() - solicitud.fecha_revision > timedelta(minutes=10):
            raise HTTPException(status_code=400, detail="Solo se puede deshacer el rechazo durante los primeros 10 minutos")
        if _usuario_empresa(db, id_empresa) is not None:
            raise HTTPException(status_code=400, detail="No se puede deshacer el rechazo porque la empresa ya tiene cuenta")
        if db.query(VacanteModel).filter(VacanteModel.id_empresa == id_empresa).count() > 0:
            raise HTTPException(status_code=400, detail="No se puede deshacer el rechazo porque la empresa ya tiene vacantes")
        if (
            db.query(ParticipacionEmpresaConvocatoriaModel)
            .filter(
                ParticipacionEmpresaConvocatoriaModel.id_empresa == id_empresa,
                ParticipacionEmpresaConvocatoriaModel.estado == "Aceptada",
            )
            .count()
            > 0
        ):
            raise HTTPException(status_code=400, detail="No se puede deshacer el rechazo porque la empresa ya avanzo en convocatorias")
        if obtener_convenio_vigente_actual(db, id_empresa) is not None or obtener_vinculacion_aprobada_actual(db, id_empresa) is not None:
            raise HTTPException(status_code=400, detail="No se puede deshacer el rechazo porque la empresa ya avanzo a otra etapa")
        solicitud.estado_solicitud = "En revisión"
        solicitud.observaciones = (
            f"{solicitud.observaciones or ''}\nRechazo deshecho por usuario {usuario_actual.id_usuario}."
        ).strip()
        solicitud.revisada_por = usuario_actual.id_usuario
        solicitud.fecha_revision = datetime.now()

    if datos.estado_empresa == "Activa":
        _validar_documentacion_empresa_aprobada(db, id_empresa)
        validar_habilitacion_empresa_para_vacantes(db, empresa)

    empresa.estado_empresa = datos.estado_empresa
    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Deshacer rechazo de empresa" if estado_anterior == "Rechazada" and datos.estado_empresa == "Pendiente" else "Cambiar estado de empresa",
        "empresas",
        f"Empresa {id_empresa} cambio de {estado_anterior} a {datos.estado_empresa}.",
        "empresa",
        id_empresa,
    )
    db.commit()
    db.refresh(empresa)

    return {"mensaje": "Estado de empresa actualizado", "estado_empresa": empresa.estado_empresa}
