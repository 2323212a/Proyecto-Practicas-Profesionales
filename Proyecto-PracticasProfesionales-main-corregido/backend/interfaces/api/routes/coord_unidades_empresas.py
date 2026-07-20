from __future__ import annotations

from datetime import date, datetime, timedelta

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlalchemy.orm import Session

from app.services.auditoria_service import registrar_bitacora
from app.services.convocatoria_rules_service import validar_etapa_actual
from app.services.empresa_reglas_service import (
    obtener_convenio_vigente_actual,
    obtener_vinculacion_aprobada_actual,
    validar_habilitacion_empresa_para_vacantes,
    validar_participacion_aceptada,
)
from infrastructure.database.dependencies import obtener_db
from infrastructure.email.email_service import enviar_correo_empresa_aceptada, enviar_correo_empresa_rechazada
from infrastructure.security.auth_dependencies import requerir_roles
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.bitacora_auditoria import BitacoraAuditoriaModel
from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.documento_empresa import DocumentoEmpresaModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.rol import RolModel
from infrastructure.persistence.models.solicitud_empresa import SolicitudEmpresaModel
from infrastructure.persistence.models.tipo_documento_empresa import TipoDocumentoEmpresaModel
from infrastructure.persistence.models.participacion_empresa_convocatoria import ParticipacionEmpresaConvocatoriaModel
from infrastructure.persistence.models.vacante import VacanteModel

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
        alertas.append(f"{documentos_pendientes} documento(s) de empresa esperan revision.")
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
        "password_temporal": password_temporal,
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
                f"Se envio aviso de rechazo a la empresa {empresa.nombre_empresa}.",
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
            f"No se envio aviso de rechazo a la empresa {empresa.nombre_empresa} porque no tiene correo de contacto.",
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


@router.patch("/vacantes/{id_vacante}/estado")
def cambiar_estado_vacante(
    id_vacante: int,
    datos: CambiarEstadoVacanteRequest,
    db: Session = Depends(obtener_db),
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

    if datos.estado_vacante == "PrePadron":
        validar_etapa_actual(vacante.convocatoria, "empresas")
        validar_participacion_aceptada(db, vacante.id_empresa, vacante.id_convocatoria)
        validar_habilitacion_empresa_para_vacantes(db, vacante.empresa)
    if datos.estado_vacante == "Activa":
        raise HTTPException(status_code=400, detail="La liberacion a Activa se realiza desde Padron Empresarial.")

    vacante.estado_vacante = datos.estado_vacante
    vacante.observaciones = datos.observaciones
    db.commit()
    db.refresh(vacante)
    return {"mensaje": "Estado de vacante actualizado", "estado_vacante": vacante.estado_vacante}


@router.post("/vacantes/liberar-prepadron")
def liberar_prepadron(
    filtros: LiberarPrepadronRequest | None = None,
    db: Session = Depends(obtener_db),
):
    filtros = filtros or LiberarPrepadronRequest()
    query = db.query(VacanteModel).filter(VacanteModel.estado_vacante == "PrePadron")
    if filtros.id_convocatoria is not None:
        query = query.filter(VacanteModel.id_convocatoria == filtros.id_convocatoria)
    if filtros.id_tipo_practica is not None:
        query = query.filter(VacanteModel.id_tipo_practica == filtros.id_tipo_practica)

    vacantes = query.all()
    liberadas = 0
    for vacante in vacantes:
        if (
            vacante.empresa.estado_empresa == "Activa"
        ):
            try:
                validar_participacion_aceptada(db, vacante.id_empresa, vacante.id_convocatoria)
                validar_etapa_actual(vacante.convocatoria, "empresas")
                validar_habilitacion_empresa_para_vacantes(db, vacante.empresa)
                vacante.estado_vacante = "Activa"
                liberadas += 1
            except HTTPException:
                continue
    db.commit()
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
        solicitud.estado_solicitud = "En revision"
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
