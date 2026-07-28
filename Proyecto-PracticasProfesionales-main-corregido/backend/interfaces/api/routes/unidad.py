from __future__ import annotations

import mimetypes
from datetime import date
from decimal import Decimal
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy import func, text
from sqlalchemy.orm import Session, joinedload

from app.services.convenio_empresa_service import (
    obtener_convenio_actual,
    obtener_convenio_vigente,
)
from app.services.auditoria_service import registrar_bitacora
from app.services.convocatoria_rules_service import validar_etapa_actual
from app.services.empresa_reglas_service import (
    convocatoria_activa_para_empresas,
    obtener_vinculacion_aprobada_actual,
    validar_habilitacion_empresa_para_vacantes,
)
from app.services.notificacion_service import notificar_roles
from app.services.upload_security import (
    nombre_descarga_seguro,
    normalizar_nombre_archivo,
    resolver_archivo_en_uploads,
    validar_documento_liberacion,
)
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import obtener_id_empresa_actual, requerir_empresa_actual_o_roles
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.documento_empresa import DocumentoEmpresaModel
from infrastructure.persistence.models.documento_vacante import DocumentoVacanteModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.evaluacion_empresa_alumno import EvaluacionEmpresaAlumnoModel
from infrastructure.persistence.models.horas import HorasModel
from infrastructure.persistence.models.personal_interno import PersonalInternoModel
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel
from infrastructure.persistence.models.carrera import CarreraModel
from infrastructure.persistence.models.formato_plan_trabajo_vacante import FormatoPlanTrabajoVacanteModel
from infrastructure.persistence.models.solicitud_ampliacion_cupos_vacante import SolicitudAmpliacionCuposVacanteModel
from infrastructure.persistence.models.solicitud_ampliacion_cupos_vacante_detalle import SolicitudAmpliacionCuposVacanteDetalleModel
from infrastructure.persistence.models.tipo_documento_empresa import TipoDocumentoEmpresaModel
from infrastructure.persistence.models.tipo_practica import TipoPracticaModel
from infrastructure.persistence.models.participacion_empresa_convocatoria import ParticipacionEmpresaConvocatoriaModel
from infrastructure.persistence.models.vacante import VacanteModel
from infrastructure.persistence.models.vacante_carrera import VacanteCarreraModel
from infrastructure.persistence.models.vacante_tipo_practica import VacanteTipoPracticaModel


router = APIRouter(
    prefix="/unidad",
    tags=["Unidad Receptora"],
    dependencies=[Depends(requerir_empresa_actual_o_roles(["Administrador"]))],
)

UPLOADS_DIR = Path(__file__).resolve().parents[3] / "uploads"
UPLOAD_PLANES_DIR = UPLOADS_DIR / "vacantes" / "planes-trabajo"


class CambiarEstadoHorasUnidadRequest(BaseModel):
    estado: str
    observaciones: str | None = None


def _tiene_convenio_vigente(db: Session, id_empresa: int) -> bool:
    return obtener_convenio_vigente(db, id_empresa) is not None


def _estado_convenio_empresa(db: Session, id_empresa: int) -> str | None:
    convenio = obtener_convenio_actual(db, id_empresa)
    return convenio.estado_convenio if convenio else None


def _requisito_permitido_para_empresa(tipo: TipoDocumentoEmpresaModel, empresa: EmpresaModel) -> bool:
    return tipo.tipo_tramite in (None, "", "Todos", "Todas") or tipo.tipo_tramite == empresa.tipo_tramite


def _documentacion_legal_aprobada(db: Session, id_empresa: int) -> bool:
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        return False
    tipos_obligatorios = (
        db.query(TipoDocumentoEmpresaModel)
        .filter(
            TipoDocumentoEmpresaModel.activo.is_(True),
            TipoDocumentoEmpresaModel.obligatorio.is_(True),
            TipoDocumentoEmpresaModel.etapa == "Documentacion",
        )
        .all()
    )
    tipos_obligatorios = [
        tipo for tipo in tipos_obligatorios if _requisito_permitido_para_empresa(tipo, empresa)
    ]
    if not tipos_obligatorios:
        return False

    documentos = (
        db.query(DocumentoEmpresaModel)
        .filter(DocumentoEmpresaModel.id_empresa == id_empresa)
        .order_by(DocumentoEmpresaModel.id_documento_empresa.desc())
        .all()
    )
    por_tipo = {}
    for documento in documentos:
        por_tipo.setdefault(documento.id_tipo_documento_empresa, documento)
    return all(
        por_tipo.get(tipo.id_tipo_documento_empresa) is not None
        and por_tipo[tipo.id_tipo_documento_empresa].estado_documento == "Aprobado"
        for tipo in tipos_obligatorios
    )


def _estado_vacantes_empresa(db: Session, empresa: EmpresaModel) -> dict:
    documentacion_ok = _documentacion_legal_aprobada(db, empresa.id_empresa)
    convenio_vigente = _tiene_convenio_vigente(db, empresa.id_empresa)
    convenio_estado = _estado_convenio_empresa(db, empresa.id_empresa)
    vinculacion_ok = obtener_vinculacion_aprobada_actual(db, empresa.id_empresa) is not None
    tramite_ok = (
        convenio_vigente
        if empresa.tipo_tramite == "Convenio"
        else vinculacion_ok
        if empresa.tipo_tramite == "Vinculacion"
        else False
    )
    puede_capturar = documentacion_ok and tramite_ok

    if puede_capturar:
        motivo = None
    elif not documentacion_ok:
        motivo = "Necesitas documentación legal aprobada antes de capturar vacantes."
    elif empresa.tipo_tramite == "Vinculacion":
        motivo = "Necesitas vinculación aprobada antes de capturar vacantes."
    else:
        motivo = "Necesitas convenio vigente antes de capturar vacantes."

    return {
        "tipo_tramite": empresa.tipo_tramite,
        "documentacion_legal_aprobada": documentacion_ok,
        "convenio_vigente": convenio_vigente,
        "convenio_estado": convenio_estado,
        "vinculacion_aprobada": vinculacion_ok,
        "tramite_vigente": tramite_ok,
        "puede_capturar_vacantes": puede_capturar,
        "motivo_bloqueo": motivo,
    }


def _convocatoria_disponible_empresas(db: Session) -> ConvocatoriaModel | None:
    convocatorias = (
        db.query(ConvocatoriaModel)
        .filter(ConvocatoriaModel.estado == "Activa")
        .order_by(ConvocatoriaModel.fecha_inicio_general.desc(), ConvocatoriaModel.id_convocatoria.desc())
        .all()
    )
    for convocatoria in convocatorias:
        try:
            validar_etapa_actual(convocatoria, "empresas")
            return convocatoria
        except HTTPException:
            continue
    return None


def _participacion_response(participacion: ParticipacionEmpresaConvocatoriaModel | None) -> dict | None:
    if participacion is None:
        return None
    return {
        "id_participacion": participacion.id_participacion,
        "id_convocatoria": participacion.id_convocatoria,
        "convocatoria": participacion.convocatoria.nombre if participacion.convocatoria else None,
        "estado": participacion.estado,
        "observaciones": participacion.observaciones,
        "motivo_rechazo": participacion.motivo_rechazo,
    }


def _convocatoria_basica_response(convocatoria: ConvocatoriaModel | None) -> dict | None:
    if convocatoria is None:
        return None
    return {
        "id_convocatoria": convocatoria.id_convocatoria,
        "nombre": convocatoria.nombre,
        "tipo_periodo": convocatoria.tipo_periodo,
        "estado": convocatoria.estado,
        "fecha_inicio_general": convocatoria.fecha_inicio_general.isoformat() if convocatoria.fecha_inicio_general else None,
        "fecha_cierre_general": convocatoria.fecha_cierre_general.isoformat() if convocatoria.fecha_cierre_general else None,
        "fecha_inicio_empresas": convocatoria.fecha_inicio_empresas.isoformat() if convocatoria.fecha_inicio_empresas else None,
        "fecha_cierre_empresas": convocatoria.fecha_cierre_empresas.isoformat() if convocatoria.fecha_cierre_empresas else None,
    }


def _etapa_empresas_convocatoria(convocatoria: ConvocatoriaModel) -> str:
    hoy = date.today()
    if convocatoria.fecha_inicio_empresas and hoy < convocatoria.fecha_inicio_empresas:
        return "Próxima"
    if convocatoria.fecha_cierre_empresas and hoy > convocatoria.fecha_cierre_empresas:
        return "Finalizada"
    return "Empresas"


def _calendario_operativo_valido(convocatoria: ConvocatoriaModel) -> bool:
    rangos = [
        (convocatoria.fecha_inicio_general, convocatoria.fecha_cierre_general),
        (convocatoria.fecha_inicio_empresas, convocatoria.fecha_cierre_empresas),
    ]
    return all(inicio is None or cierre is None or inicio <= cierre for inicio, cierre in rangos)


def _convocatoria_disponible_response(
    db: Session,
    id_empresa: int,
    convocatoria: ConvocatoriaModel,
) -> dict:
    participacion = (
        db.query(ParticipacionEmpresaConvocatoriaModel)
        .filter(
            ParticipacionEmpresaConvocatoriaModel.id_empresa == id_empresa,
            ParticipacionEmpresaConvocatoriaModel.id_convocatoria == convocatoria.id_convocatoria,
        )
        .first()
    )
    vacante = (
        db.query(VacanteModel)
        .filter(
            VacanteModel.id_empresa == id_empresa,
            VacanteModel.id_convocatoria == convocatoria.id_convocatoria,
        )
        .first()
    )
    etapa = _etapa_empresas_convocatoria(convocatoria)
    calendario_valido = _calendario_operativo_valido(convocatoria)
    if not calendario_valido:
        motivo_bloqueo = "La convocatoria no tiene calendario operativo válido."
    elif participacion and participacion.estado == "Rechazada":
        motivo_bloqueo = participacion.motivo_rechazo or "La inscripción fue rechazada para esta convocatoria."
    elif vacante is not None:
        motivo_bloqueo = "Ya tienes una vacante registrada para esta convocatoria."
    else:
        motivo_bloqueo = None
    return {
        "id_convocatoria": convocatoria.id_convocatoria,
        "nombre": convocatoria.nombre,
        "tipo_periodo": convocatoria.tipo_periodo,
        "estado": convocatoria.estado,
        "etapa_actual": etapa,
        "fecha_inicio_general": convocatoria.fecha_inicio_general.isoformat() if convocatoria.fecha_inicio_general else None,
        "fecha_cierre_general": convocatoria.fecha_cierre_general.isoformat() if convocatoria.fecha_cierre_general else None,
        "fecha_inicio_empresas": convocatoria.fecha_inicio_empresas.isoformat() if convocatoria.fecha_inicio_empresas else None,
        "fecha_cierre_empresas": convocatoria.fecha_cierre_empresas.isoformat() if convocatoria.fecha_cierre_empresas else None,
        "participacion": _participacion_response(participacion),
        "vacante": (
            {
                "id_vacante": vacante.id_vacante,
                "titulo": vacante.titulo,
                "estado_vacante": vacante.estado_vacante,
            }
            if vacante
            else None
        ),
        "puede_seleccionar": motivo_bloqueo is None or (participacion is not None and participacion.estado in {"Pendiente", "Aceptada"}),
        "motivo_bloqueo": motivo_bloqueo,
    }


def _tipos_practica_vacante(db: Session, vacante: VacanteModel) -> list[dict]:
    configuraciones = (
        db.query(VacanteTipoPracticaModel)
        .join(TipoPracticaModel, TipoPracticaModel.id_tipo_practica == VacanteTipoPracticaModel.id_tipo_practica)
        .filter(
            VacanteTipoPracticaModel.id_vacante == vacante.id_vacante,
            VacanteTipoPracticaModel.activo.is_(True),
        )
        .order_by(TipoPracticaModel.orden.asc(), TipoPracticaModel.nombre.asc())
        .all()
    )
    if not configuraciones and vacante.id_tipo_practica:
        tipo = db.query(TipoPracticaModel).filter(TipoPracticaModel.id_tipo_practica == vacante.id_tipo_practica).first()
        if tipo is not None:
            configuraciones = [
                VacanteTipoPracticaModel(
                    id_vacante=vacante.id_vacante,
                    id_tipo_practica=tipo.id_tipo_practica,
                    cupos=vacante.cupos,
                    activo=True,
                    tipo_practica=tipo,
                )
            ]

    respuesta = []
    for config in configuraciones:
        usados = (
            db.query(func.count(AsignacionModel.id_asignacion))
            .filter(
                AsignacionModel.id_vacante == vacante.id_vacante,
                AsignacionModel.id_tipo_practica == config.id_tipo_practica,
                AsignacionModel.estado_asignacion == "Activa",
            )
            .scalar()
            or 0
        )
        respuesta.append(
            {
                "id_tipo_practica": config.id_tipo_practica,
                "nombre": config.tipo_practica.nombre if config.tipo_practica else None,
                "cupos": config.cupos,
                "cupos_usados": usados,
                "cupos_disponibles": max(config.cupos - usados, 0),
                "activo": bool(config.activo),
            }
        )
    return respuesta


def _carreras_vacante(db: Session, vacante: VacanteModel) -> list[dict]:
    carreras = (
        db.query(VacanteCarreraModel)
        .join(CarreraModel, CarreraModel.id_carrera == VacanteCarreraModel.id_carrera)
        .filter(VacanteCarreraModel.id_vacante == vacante.id_vacante)
        .order_by(CarreraModel.nombre.asc())
        .all()
    )
    return [
        {
            "id_carrera": item.id_carrera,
            "nombre": item.carrera.nombre if item.carrera else "Carrera sin nombre",
        }
        for item in carreras
    ]


def _solicitudes_ampliacion_vacante(db: Session, vacante: VacanteModel) -> list[dict]:
    solicitudes = (
        db.query(SolicitudAmpliacionCuposVacanteModel)
        .filter(SolicitudAmpliacionCuposVacanteModel.id_vacante == vacante.id_vacante)
        .order_by(SolicitudAmpliacionCuposVacanteModel.id_solicitud_ampliacion.desc())
        .all()
    )
    return [
        {
            "id_solicitud_ampliacion": solicitud.id_solicitud_ampliacion,
            "id_tipo_practica": solicitud.id_tipo_practica,
            "cupos_solicitados": solicitud.cupos_solicitados,
            "motivo": solicitud.motivo,
            "estado": solicitud.estado,
            "fecha_solicitud": solicitud.fecha_solicitud.isoformat() if solicitud.fecha_solicitud else None,
            "observaciones": solicitud.observaciones,
            "detalles": [
                {
                    "id_detalle_ampliacion": detalle.id_detalle_ampliacion,
                    "id_tipo_practica": detalle.id_tipo_practica,
                    "tipo_practica": detalle.tipo_practica.nombre if detalle.tipo_practica else None,
                    "cupos_solicitados": detalle.cupos_solicitados,
                    "cupos_aprobados": detalle.cupos_aprobados,
                    "estado": detalle.estado,
                    "observaciones": detalle.observaciones,
                }
                for detalle in solicitud.detalles
            ],
        }
        for solicitud in solicitudes
    ]


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
        "tipo_documento": documento.tipo_documento,
        "nombre_archivo": documento.nombre_archivo,
        "estado_documento": documento.estado_documento,
        "observaciones": documento.observaciones,
        "fecha_subida": documento.fecha_subida.isoformat() if documento.fecha_subida else None,
        "fecha_revision": documento.fecha_revision.isoformat() if documento.fecha_revision else None,
        "activo": bool(documento.activo),
        "url_descarga": f"/unidad/vacantes/{vacante.id_vacante}/plan-trabajo/archivo",
    }


def _formato_plan_response(formato: FormatoPlanTrabajoVacanteModel | None) -> dict | None:
    if formato is None:
        return None
    return {
        "id_formato_plan": formato.id_formato_plan,
        "id_convocatoria": formato.id_convocatoria,
        "nombre": formato.nombre,
        "descripcion": formato.descripcion,
        "nombre_archivo": formato.nombre_archivo,
        "activo": bool(formato.activo),
        "fecha_subida": formato.fecha_subida.isoformat() if formato.fecha_subida else None,
        "url_descarga": f"/unidad/vacantes/formatos-plan-trabajo/{formato.id_formato_plan}/archivo",
    }


def _formato_plan_aplicable(db: Session, id_convocatoria: int | None) -> FormatoPlanTrabajoVacanteModel | None:
    if id_convocatoria is not None:
        especifico = (
            db.query(FormatoPlanTrabajoVacanteModel)
            .filter(
                FormatoPlanTrabajoVacanteModel.id_convocatoria == id_convocatoria,
                FormatoPlanTrabajoVacanteModel.activo.is_(True),
            )
            .order_by(FormatoPlanTrabajoVacanteModel.id_formato_plan.desc())
            .first()
        )
        if especifico is not None:
            return especifico
    return (
        db.query(FormatoPlanTrabajoVacanteModel)
        .filter(
            FormatoPlanTrabajoVacanteModel.id_convocatoria.is_(None),
            FormatoPlanTrabajoVacanteModel.activo.is_(True),
        )
        .order_by(FormatoPlanTrabajoVacanteModel.id_formato_plan.desc())
        .first()
    )


def _historial_plan_trabajo_vacante(db: Session, vacante: VacanteModel) -> list[dict]:
    documentos = (
        db.query(DocumentoVacanteModel)
        .filter(
            DocumentoVacanteModel.id_vacante == vacante.id_vacante,
            DocumentoVacanteModel.tipo_documento == "Plan de trabajo",
        )
        .order_by(DocumentoVacanteModel.id_documento_vacante.desc())
        .all()
    )
    return [
        {
            "id_documento_vacante": documento.id_documento_vacante,
            "nombre_archivo": documento.nombre_archivo,
            "estado_documento": documento.estado_documento,
            "observaciones": documento.observaciones,
            "fecha_subida": documento.fecha_subida.isoformat() if documento.fecha_subida else None,
            "fecha_revision": documento.fecha_revision.isoformat() if documento.fecha_revision else None,
            "activo": bool(documento.activo),
        }
        for documento in documentos
    ]


def _vacante_detalle_response(db: Session, vacante: VacanteModel) -> dict:
    tipos_practica = _tipos_practica_vacante(db, vacante)
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
        "carreras": _carreras_vacante(db, vacante),
        "tipos_practica": tipos_practica,
        "solicitudes_ampliacion": _solicitudes_ampliacion_vacante(db, vacante),
        "estado_vacante": vacante.estado_vacante,
        "periodo": vacante.periodo,
        "id_tipo_practica": vacante.id_tipo_practica,
        "tipo_practica": vacante.tipo_practica.nombre if vacante.tipo_practica else None,
        "id_convocatoria": vacante.id_convocatoria,
        "convocatoria": vacante.convocatoria.nombre if vacante.convocatoria else None,
        "observaciones": vacante.observaciones,
        "fecha_creacion": vacante.fecha_creacion.isoformat() if vacante.fecha_creacion else None,
        "fecha_revision": vacante.fecha_revision.isoformat() if vacante.fecha_revision else None,
        "revisada_por": vacante.revisada_por,
        "plan_trabajo": _plan_trabajo_vacante(db, vacante),
        "formato_plan_trabajo": _formato_plan_response(_formato_plan_aplicable(db, vacante.id_convocatoria)),
        "historial_plan_trabajo": _historial_plan_trabajo_vacante(db, vacante),
    }


def _asegurar_vacante_editable_empresa(vacante: VacanteModel) -> None:
    if vacante.estado_vacante not in {"Pendiente", "Con observaciones", "Rechazada"}:
        raise HTTPException(status_code=400, detail="Esta vacante no puede editarse desde la empresa.")


def _normalizar_tipos_vacante(datos: CrearVacanteUnidadRequest) -> list[TipoPracticaVacanteRequest]:
    tipos = datos.tipos_practica or []
    if not tipos and datos.id_tipo_practica is not None:
        tipos = [TipoPracticaVacanteRequest(id_tipo_practica=datos.id_tipo_practica, cupos=datos.cupos or 0)]
    if not tipos:
        raise HTTPException(status_code=400, detail="Selecciona al menos un tipo de práctica.")

    tipos_por_id: dict[int, TipoPracticaVacanteRequest] = {}
    for item in tipos:
        if item.cupos <= 0:
            raise HTTPException(status_code=400, detail="Los cupos por tipo de práctica deben ser mayores a cero.")
        tipos_por_id[item.id_tipo_practica] = item
    total = sum(item.cupos for item in tipos_por_id.values())
    if total < 1:
        raise HTTPException(status_code=400, detail="La vacante debe tener al menos un cupo.")
    if total > 3:
        raise HTTPException(
            status_code=400,
            detail="Para más de 3 cupos debes solicitar autorización a Coordinación de Unidades.",
        )
    return list(tipos_por_id.values())


def _validar_tipos_vacante(db: Session, tipos: list[TipoPracticaVacanteRequest]) -> None:
    ids = [tipo.id_tipo_practica for tipo in tipos]
    activos = {
        tipo.id_tipo_practica
        for tipo in db.query(TipoPracticaModel)
        .filter(TipoPracticaModel.id_tipo_practica.in_(ids), TipoPracticaModel.activo.is_(True))
        .all()
    }
    if set(ids) != activos:
        raise HTTPException(status_code=400, detail="Todos los tipos de práctica seleccionados deben existir y estar activos.")


def _validar_carreras_vacante(db: Session, aplica_todas: bool, ids_carrera: list[int], tipo_periodo: str) -> list[int]:
    compatibles = (
        db.query(CarreraModel)
        .filter(CarreraModel.estado == "Activa", CarreraModel.tipo_periodo == tipo_periodo)
        .all()
    )
    if not compatibles:
        raise HTTPException(status_code=400, detail="No hay carreras activas compatibles con esta convocatoria.")
    ids = sorted(set(ids_carrera or []))
    if aplica_todas:
        return []
    if not ids:
        raise HTTPException(status_code=400, detail="Selecciona al menos una carrera compatible o marca Todas las carreras compatibles.")
    carreras = (
        db.query(CarreraModel)
        .filter(CarreraModel.id_carrera.in_(ids), CarreraModel.estado == "Activa")
        .all()
    )
    activas = {
        carrera.id_carrera
        for carrera in carreras
    }
    if set(ids) != activas:
        raise HTTPException(status_code=400, detail="Todas las carreras seleccionadas deben existir y estar activas.")
    if any(carrera.tipo_periodo != tipo_periodo for carrera in carreras):
        raise HTTPException(status_code=400, detail="La carrera seleccionada no corresponde al tipo de periodo de la convocatoria.")
    return ids


class TipoPracticaVacanteRequest(BaseModel):
    id_tipo_practica: int
    cupos: int


class CrearVacanteUnidadRequest(BaseModel):
    id_convocatoria: int
    id_tipo_practica: int | None = None
    titulo: str
    descripcion: str | None = None
    actividades: str | None = None
    requisitos: str | None = None
    cupos: int | None = None
    aplica_todas_carreras: bool = True
    ids_carrera: list[int] = []
    tipos_practica: list[TipoPracticaVacanteRequest] = []


class SolicitarAmpliacionCuposRequest(BaseModel):
    id_tipo_practica: int | None = None
    cupos_solicitados: int | None = None
    motivo: str
    detalles: list[TipoPracticaVacanteRequest] = []


class SolicitarParticipacionRequest(BaseModel):
    id_convocatoria: int
    observaciones: str | None = None


def _nombre_usuario(perfil) -> str:
    if perfil is None:
        return "Sin nombre"
    return " ".join(
        parte
        for parte in [getattr(perfil, "nombre", None), getattr(perfil, "apellido_paterno", None), getattr(perfil, "apellido_materno", None)]
        if parte
    ) or getattr(perfil, "correo", "Sin nombre")


def _decimal_to_float(valor) -> float:
    if isinstance(valor, Decimal):
        return float(valor)
    return float(valor or 0)


def _hora_unidad_response(hora: HorasModel) -> dict:
    asignacion = hora.asignacion
    alumno = asignacion.alumno
    return {
        "id_horas": hora.id_horas,
        "id_asignacion": hora.id_asignacion,
        "id_alumno": alumno.id_alumno,
        "alumno": _nombre_usuario(alumno),
        "matricula": alumno.matricula,
        "carrera": alumno.carrera.nombre if alumno.carrera else "Sin carrera",
        "proyecto": asignacion.vacante.titulo if asignacion.vacante else "Sin proyecto",
        "fecha": hora.fecha.isoformat(),
        "horas": _decimal_to_float(hora.horas_realizadas),
        "actividad": hora.actividad,
        "estado": hora.estado_horas,
        "observaciones": hora.observaciones,
        "evidencia_archivo": hora.evidencia_archivo,
        "fecha_registro": hora.fecha_registro.isoformat() if hora.fecha_registro else None,
    }


def _empresa_basica_response(empresa: EmpresaModel) -> dict:
    return {
        "id_empresa": empresa.id_empresa,
        "nombre_empresa": empresa.nombre_empresa,
        "rfc": empresa.rfc,
        "giro": empresa.giro,
        "domicilio": empresa.domicilio,
        "telefono": empresa.telefono,
        "correo_contacto": empresa.correo_contacto,
        "estado_empresa": empresa.estado_empresa,
        "tipo_tramite": empresa.tipo_tramite,
    }


def _alumnos_unidad_items(id_empresa: int, db: Session) -> list[dict]:
    asignaciones = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.vacante),
            joinedload(AsignacionModel.asesor).joinedload(PersonalInternoModel.usuario),
            joinedload(AsignacionModel.horas),
        )
        .filter(
            AsignacionModel.id_empresa == id_empresa,
            AsignacionModel.estado_asignacion == "Activa",
        )
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .all()
    )

    alumnos = []
    for asignacion in asignaciones:
        alumno = asignacion.alumno
        horas_aprobadas = sum(
            _decimal_to_float(horas.horas_realizadas)
            for horas in asignacion.horas
            if horas.estado_horas == "Aprobada"
        )
        horas_pendientes = sum(
            _decimal_to_float(horas.horas_realizadas)
            for horas in asignacion.horas
            if horas.estado_horas == "Pendiente"
        )
        total_horas = 480
        avance = round((horas_aprobadas / total_horas) * 100) if total_horas else 0
        estado = "Por evaluar" if avance >= 80 else "Activo"

        alumnos.append(
            {
                "id_asignacion": asignacion.id_asignacion,
                "id_alumno": alumno.id_alumno,
                "nombre": _nombre_usuario(alumno),
                "matricula": alumno.matricula,
                "carrera": alumno.carrera.nombre if alumno.carrera else "Sin carrera",
                "semestre": alumno.semestre,
                "grupo": alumno.grupo,
                "proyecto": asignacion.vacante.titulo if asignacion.vacante else "Sin proyecto",
                "vacante": asignacion.vacante.titulo if asignacion.vacante else "Sin vacante",
                "horas_aprobadas": horas_aprobadas,
                "horas_pendientes": horas_pendientes,
                "total_horas": total_horas,
                "avance": avance,
                "estado": estado,
                "asesor": (
                    _nombre_usuario(asignacion.asesor.usuario)
                    if asignacion.asesor and asignacion.asesor.usuario
                    else "Sin asesor asignado"
                ),
                "fecha_inicio": asignacion.fecha_asignacion.isoformat(),
                "fecha_fin": None,
                "tipo_asignacion": asignacion.tipo_asignacion,
            }
        )

    return alumnos


@router.get("/me/dashboard")
def obtener_dashboard_mi_unidad(
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    alumnos = _alumnos_unidad_items(id_empresa, db)
    asignacion_ids = [alumno["id_asignacion"] for alumno in alumnos]
    vacantes = (
        db.query(VacanteModel)
        .filter(VacanteModel.id_empresa == id_empresa)
        .order_by(VacanteModel.id_vacante.desc())
        .limit(5)
        .all()
    )
    convenios = (
        db.query(ConvenioModel)
        .filter(ConvenioModel.id_empresa == id_empresa)
        .order_by(
            ConvenioModel.es_actual.desc(),
            ConvenioModel.fecha_fin.desc(),
            ConvenioModel.id_convenio.desc(),
        )
        .all()
    )
    horas_aprobadas = (
        db.query(func.coalesce(func.sum(HorasModel.horas_realizadas), 0))
        .join(AsignacionModel, HorasModel.id_asignacion == AsignacionModel.id_asignacion)
        .filter(AsignacionModel.id_empresa == id_empresa, HorasModel.estado_horas == "Aprobada")
        .scalar()
        or 0
    )
    evaluadas = (
        db.query(EvaluacionEmpresaAlumnoModel.id_asignacion)
        .filter(EvaluacionEmpresaAlumnoModel.id_asignacion.in_(asignacion_ids))
        .all()
        if asignacion_ids
        else []
    )
    evaluadas_ids = {item[0] for item in evaluadas}
    evaluaciones_pendientes = [
        alumno for alumno in alumnos if alumno["id_asignacion"] not in evaluadas_ids
    ]

    return {
        "empresa": _empresa_basica_response(empresa),
        "resumen": {
            "alumnos_activos": len(alumnos),
            "planes_trabajo": db.query(VacanteModel).filter(VacanteModel.id_empresa == id_empresa).count(),
            "convenios_vigentes": sum(
                1
                for convenio in convenios
                if convenio.es_actual
                and convenio.estado_convenio == "Vigente"
                and convenio.fecha_inicio is not None
                and convenio.fecha_fin is not None
                and convenio.fecha_inicio <= date.today() <= convenio.fecha_fin
            ),
            "horas_registradas": _decimal_to_float(horas_aprobadas),
            "evaluaciones_pendientes": len(evaluaciones_pendientes),
        },
        "alumnos": alumnos[:6],
        "vacantes": [
            {
                "id_vacante": vacante.id_vacante,
                "titulo": vacante.titulo,
                "estado_vacante": vacante.estado_vacante,
                "cupos": vacante.cupos,
                "periodo": vacante.periodo,
            }
            for vacante in vacantes
        ],
        "convenios": [
            {
                "id_convenio": convenio.id_convenio,
                "fecha_inicio": convenio.fecha_inicio.isoformat() if convenio.fecha_inicio else None,
                "fecha_fin": convenio.fecha_fin.isoformat() if convenio.fecha_fin else None,
                "estado_convenio": convenio.estado_convenio,
                "es_actual": convenio.es_actual,
                "observaciones": convenio.observaciones,
            }
            for convenio in convenios
        ],
        "evaluaciones_pendientes": evaluaciones_pendientes[:5],
    }


@router.get("/me/perfil")
def obtener_perfil_mi_unidad(
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    empresa = (
        db.query(EmpresaModel)
        .options(joinedload(EmpresaModel.responsables).joinedload(ResponsableEmpresaModel.usuario))
        .filter(EmpresaModel.id_empresa == id_empresa)
        .first()
    )
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    alumnos = _alumnos_unidad_items(id_empresa, db)
    convenios = (
        db.query(ConvenioModel)
        .filter(ConvenioModel.id_empresa == id_empresa)
        .order_by(
            ConvenioModel.es_actual.desc(),
            ConvenioModel.fecha_fin.desc(),
            ConvenioModel.id_convenio.desc(),
        )
        .all()
    )
    vacantes = db.query(VacanteModel).filter(VacanteModel.id_empresa == id_empresa).all()

    return {
        "empresa": _empresa_basica_response(empresa),
        "resumen": {
            "alumnos_asignados": len(alumnos),
            "convenios_vigentes": sum(
                1
                for convenio in convenios
                if convenio.es_actual
                and convenio.estado_convenio == "Vigente"
                and convenio.fecha_inicio is not None
                and convenio.fecha_fin is not None
                and convenio.fecha_inicio <= date.today() <= convenio.fecha_fin
            ),
            "planes_disponibles": sum(1 for vacante in vacantes if vacante.estado_vacante == "Activa"),
        },
        "responsables": [
            {
                "id_responsable": responsable.id_responsable,
                "nombre": _nombre_usuario(responsable.usuario) if responsable.usuario else "Sin usuario",
                "cargo": responsable.cargo or "Responsable",
                "correo": responsable.usuario.correo if responsable.usuario else None,
                "telefono": responsable.telefono,
            }
            for responsable in empresa.responsables
        ],
        "vacantes": [
            {
                "id_vacante": vacante.id_vacante,
                "titulo": vacante.titulo,
                "descripcion": vacante.descripcion,
                "actividades": vacante.actividades,
                "requisitos": vacante.requisitos,
                "cupos": vacante.cupos,
                "periodo": vacante.periodo,
                "estado_vacante": vacante.estado_vacante,
            }
            for vacante in vacantes
        ],
        "convenios": [
            {
                "id_convenio": convenio.id_convenio,
                "fecha_inicio": convenio.fecha_inicio.isoformat() if convenio.fecha_inicio else None,
                "fecha_fin": convenio.fecha_fin.isoformat() if convenio.fecha_fin else None,
                "estado_convenio": convenio.estado_convenio,
                "es_actual": convenio.es_actual,
                "observaciones": convenio.observaciones,
            }
            for convenio in convenios
        ],
    }


@router.get("/{id_empresa:int}/alumnos")
def listar_alumnos_unidad(id_empresa: int, db: Session = Depends(obtener_db)):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    asignaciones = (
        db.query(AsignacionModel)
        .options(
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.usuario),
            joinedload(AsignacionModel.alumno).joinedload(AlumnoModel.carrera),
            joinedload(AsignacionModel.vacante),
            joinedload(AsignacionModel.asesor).joinedload(PersonalInternoModel.usuario),
            joinedload(AsignacionModel.horas),
        )
        .filter(
            AsignacionModel.id_empresa == id_empresa,
            AsignacionModel.estado_asignacion == "Activa",
        )
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .all()
    )

    alumnos = []
    for asignacion in asignaciones:
        alumno = asignacion.alumno
        horas_aprobadas = sum(
            _decimal_to_float(horas.horas_realizadas)
            for horas in asignacion.horas
            if horas.estado_horas == "Aprobada"
        )
        horas_pendientes = sum(
            _decimal_to_float(horas.horas_realizadas)
            for horas in asignacion.horas
            if horas.estado_horas == "Pendiente"
        )
        total_horas = 480
        avance = round((horas_aprobadas / total_horas) * 100) if total_horas else 0
        estado = "Por evaluar" if avance >= 80 else "Activo"

        alumnos.append(
            {
                "id_asignacion": asignacion.id_asignacion,
                "id_alumno": alumno.id_alumno,
                "nombre": _nombre_usuario(alumno),
                "matricula": alumno.matricula,
                "carrera": alumno.carrera.nombre if alumno.carrera else "Sin carrera",
                "semestre": alumno.semestre,
                "grupo": alumno.grupo,
                "proyecto": asignacion.vacante.titulo if asignacion.vacante else "Sin proyecto",
                "vacante": asignacion.vacante.titulo if asignacion.vacante else "Sin vacante",
                "horas_aprobadas": horas_aprobadas,
                "horas_pendientes": horas_pendientes,
                "total_horas": total_horas,
                "avance": avance,
                "estado": estado,
                "asesor": (
                    _nombre_usuario(asignacion.asesor.usuario)
                    if asignacion.asesor and asignacion.asesor.usuario
                    else "Sin asesor asignado"
                ),
                "fecha_inicio": asignacion.fecha_asignacion.isoformat(),
                "fecha_fin": None,
                "tipo_asignacion": asignacion.tipo_asignacion,
            }
        )

    return {
        "id_empresa": empresa.id_empresa,
        "empresa": empresa.nombre_empresa,
        "estado_empresa": empresa.estado_empresa,
        "alumnos": alumnos,
    }


@router.get("/me/alumnos")
def listar_mis_alumnos_unidad(
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return listar_alumnos_unidad(id_empresa, db)


@router.get("/{id_empresa:int}/horas")
def listar_horas_unidad(id_empresa: int, db: Session = Depends(obtener_db)):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    horas = (
        db.query(HorasModel)
        .join(AsignacionModel, HorasModel.id_asignacion == AsignacionModel.id_asignacion)
        .options(
            joinedload(HorasModel.asignacion)
            .joinedload(AsignacionModel.alumno)
            .joinedload(AlumnoModel.usuario),
            joinedload(HorasModel.asignacion)
            .joinedload(AsignacionModel.alumno)
            .joinedload(AlumnoModel.carrera),
            joinedload(HorasModel.asignacion).joinedload(AsignacionModel.vacante),
        )
        .filter(AsignacionModel.id_empresa == id_empresa)
        .order_by(HorasModel.fecha.desc(), HorasModel.id_horas.desc())
        .all()
    )

    registros = [_hora_unidad_response(hora) for hora in horas]
    horas_aprobadas = sum(registro["horas"] for registro in registros if registro["estado"] == "Aprobada")
    horas_pendientes = sum(registro["horas"] for registro in registros if registro["estado"] == "Pendiente")

    return {
        "id_empresa": empresa.id_empresa,
        "empresa": empresa.nombre_empresa,
        "resumen": {
            "total_registros": len(registros),
            "pendientes": sum(1 for registro in registros if registro["estado"] == "Pendiente"),
            "aprobadas": sum(1 for registro in registros if registro["estado"] == "Aprobada"),
            "rechazadas": sum(1 for registro in registros if registro["estado"] == "Rechazada"),
            "horas_aprobadas": horas_aprobadas,
            "horas_pendientes": horas_pendientes,
        },
        "horas": registros,
    }


@router.get("/me/horas")
def listar_mis_horas_unidad(
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return listar_horas_unidad(id_empresa, db)


@router.patch("/{id_empresa:int}/horas/{id_horas:int}/estado")
def cambiar_estado_hora_unidad(
    id_empresa: int,
    id_horas: int,
    payload: CambiarEstadoHorasUnidadRequest,
    db: Session = Depends(obtener_db),
):
    estado = payload.estado.strip()
    if estado not in {"Aprobada", "Rechazada"}:
        raise HTTPException(status_code=400, detail="El estado debe ser Aprobada o Rechazada")

    hora = (
        db.query(HorasModel)
        .join(AsignacionModel, HorasModel.id_asignacion == AsignacionModel.id_asignacion)
        .options(
            joinedload(HorasModel.asignacion)
            .joinedload(AsignacionModel.alumno)
            .joinedload(AlumnoModel.usuario),
            joinedload(HorasModel.asignacion)
            .joinedload(AsignacionModel.alumno)
            .joinedload(AlumnoModel.carrera),
            joinedload(HorasModel.asignacion).joinedload(AsignacionModel.vacante),
        )
        .filter(
            HorasModel.id_horas == id_horas,
            AsignacionModel.id_empresa == id_empresa,
        )
        .first()
    )
    if hora is None:
        raise HTTPException(status_code=404, detail="Registro de horas no encontrado para esta unidad")

    hora.estado_horas = estado
    hora.observaciones = payload.observaciones
    alumno = hora.asignacion.alumno if hora.asignacion else None
    crear_notificacion(
        db,
        alumno.id_usuario if alumno else None,
        f"Horas {estado.lower()}s",
        f"Tu registro de horas del {hora.fecha.isoformat()} fue marcado como {estado}."
        + (f" Observaciones: {payload.observaciones}" if payload.observaciones else ""),
    )
    db.commit()
    db.refresh(hora)

    return _hora_unidad_response(hora)


@router.patch("/me/horas/{id_horas:int}/estado")
def cambiar_estado_mi_hora_unidad(
    id_horas: int,
    payload: CambiarEstadoHorasUnidadRequest,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return cambiar_estado_hora_unidad(id_empresa, id_horas, payload, db)


@router.get("/{id_empresa:int}/vacantes")
def listar_vacantes_unidad(id_empresa: int, db: Session = Depends(obtener_db)):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    estado_proceso = _estado_vacantes_empresa(db, empresa)
    tramite_ok = estado_proceso["tramite_vigente"]
    documentacion_ok = estado_proceso["documentacion_legal_aprobada"]
    convocatoria_disponible = _convocatoria_disponible_empresas(db)
    participacion_actual = (
        db.query(ParticipacionEmpresaConvocatoriaModel)
        .join(ConvocatoriaModel, ConvocatoriaModel.id_convocatoria == ParticipacionEmpresaConvocatoriaModel.id_convocatoria)
        .filter(
            ParticipacionEmpresaConvocatoriaModel.id_empresa == id_empresa,
            ParticipacionEmpresaConvocatoriaModel.estado.in_(["Pendiente", "Aceptada"]),
            ConvocatoriaModel.estado != "Cerrada",
        )
        .order_by(ParticipacionEmpresaConvocatoriaModel.id_participacion.desc())
        .first()
    )
    if participacion_actual is None and convocatoria_disponible is not None:
        participacion_actual = (
            db.query(ParticipacionEmpresaConvocatoriaModel)
            .filter(
                ParticipacionEmpresaConvocatoriaModel.id_empresa == id_empresa,
                ParticipacionEmpresaConvocatoriaModel.id_convocatoria == convocatoria_disponible.id_convocatoria,
            )
            .first()
        )
    vacante_reciente = (
        db.query(VacanteModel)
        .filter(VacanteModel.id_empresa == id_empresa)
        .order_by(VacanteModel.id_vacante.desc())
        .first()
    )
    convocatoria_actual = (
        participacion_actual.convocatoria
        if participacion_actual and participacion_actual.convocatoria
        else vacante_reciente.convocatoria
        if vacante_reciente and vacante_reciente.convocatoria
        else None
    )

    puede_solicitar = (
        documentacion_ok
        and tramite_ok
        and db.query(ConvocatoriaModel).filter(ConvocatoriaModel.estado == "Activa").first() is not None
    )
    vacante_en_convocatoria = False
    if convocatoria_actual is not None:
        vacante_en_convocatoria = (
            db.query(VacanteModel)
            .filter(
                VacanteModel.id_empresa == id_empresa,
                VacanteModel.id_convocatoria == convocatoria_actual.id_convocatoria,
            )
            .first()
            is not None
        )
    participacion_rechazada = participacion_actual is not None and participacion_actual.estado == "Rechazada"
    puede_crear_vacante = documentacion_ok and tramite_ok and convocatoria_actual is not None and not participacion_rechazada and not vacante_en_convocatoria

    if not documentacion_ok:
        motivo_participacion = "No disponible: falta documentación legal aprobada."
    elif not tramite_ok and empresa.tipo_tramite == "Vinculacion":
        motivo_participacion = "No disponible: falta vinculación aprobada."
    elif not tramite_ok:
        motivo_participacion = "No disponible: falta convenio vigente."
    elif participacion_actual and participacion_actual.estado == "Pendiente":
        motivo_participacion = "Convocatoria seleccionada. Captura tu vacante para revisión."
    elif participacion_actual and participacion_actual.estado == "Aceptada":
        motivo_participacion = "Convocatoria seleccionada."
    elif participacion_actual and participacion_actual.estado == "Rechazada":
        motivo_participacion = "La inscripción a esta convocatoria fue rechazada."
    else:
        motivo_participacion = None

    if not documentacion_ok:
        motivo_crear = "No disponible: falta documentación legal aprobada."
    elif not tramite_ok and empresa.tipo_tramite == "Vinculacion":
        motivo_crear = "No disponible: falta vinculación aprobada."
    elif not tramite_ok:
        motivo_crear = "No disponible: falta convenio vigente."
    elif convocatoria_actual is None:
        motivo_crear = "Selecciona una convocatoria para registrar tu vacante."
    elif participacion_actual is not None and participacion_actual.estado == "Rechazada":
        motivo_crear = "No disponible: la inscripción a esta convocatoria fue rechazada."
    elif vacante_en_convocatoria:
        motivo_crear = "No disponible: ya tienes una vacante registrada para esta convocatoria."
    else:
        motivo_crear = None

    tipos_practica = {
        row.id_tipo_practica: row.nombre
        for row in db.execute(text("SELECT id_tipo_practica, nombre FROM tipo_practica")).all()
    }

    vacantes = (
        db.query(VacanteModel)
        .filter(VacanteModel.id_empresa == id_empresa)
        .order_by(VacanteModel.id_vacante.desc())
        .all()
    )

    return {
        "empresa": {
            "id_empresa": empresa.id_empresa,
            "nombre_empresa": empresa.nombre_empresa,
            "estado_empresa": empresa.estado_empresa,
            "tipo_tramite": empresa.tipo_tramite,
            "documentacion_legal_aprobada": estado_proceso["documentacion_legal_aprobada"],
            "convenio_vigente": estado_proceso["convenio_vigente"],
            "convenio_estado": estado_proceso["convenio_estado"],
            "vinculacion_aprobada": estado_proceso["vinculacion_aprobada"],
            "tramite_vigente": estado_proceso["tramite_vigente"],
            "estado_documentacion_legal": "Aprobada" if estado_proceso["documentacion_legal_aprobada"] else "Pendiente",
            "estado_tramite": (
                "Convenio vigente"
                if empresa.tipo_tramite == "Convenio" and estado_proceso["convenio_vigente"]
                else f"Convenio {estado_proceso['convenio_estado'] or 'pendiente'}"
                if empresa.tipo_tramite == "Convenio"
                else "Vinculación aprobada"
                if empresa.tipo_tramite == "Vinculacion" and estado_proceso["vinculacion_aprobada"]
                else "Vinculación pendiente"
            ),
            "puede_capturar_vacantes": puede_crear_vacante,
            "puede_publicar": puede_crear_vacante,
            "puede_solicitar_participacion": puede_solicitar,
            "puede_crear_vacante": puede_crear_vacante,
            "motivo_bloqueo_participacion": motivo_participacion,
            "motivo_bloqueo_vacante": motivo_crear,
            "motivo_bloqueo": estado_proceso["motivo_bloqueo"],
        },
        "convocatoria_disponible": _convocatoria_basica_response(convocatoria_actual),
        "participacion_actual": _participacion_response(participacion_actual),
        "vacantes": [
            {
                "id_vacante": vacante.id_vacante,
                "id_empresa": vacante.id_empresa,
                "titulo": vacante.titulo,
                "descripcion": vacante.descripcion,
                "actividades": vacante.actividades,
                "requisitos": vacante.requisitos,
                "cupos": vacante.cupos,
                "aplica_todas_carreras": bool(vacante.aplica_todas_carreras),
                "carreras": _carreras_vacante(db, vacante),
                "tipos_practica": _tipos_practica_vacante(db, vacante),
                "solicitudes_ampliacion": _solicitudes_ampliacion_vacante(db, vacante),
                "estado_vacante": vacante.estado_vacante,
                "periodo": vacante.periodo,
                "id_tipo_practica": vacante.id_tipo_practica,
                "tipo_practica": tipos_practica.get(vacante.id_tipo_practica),
                "id_convocatoria": vacante.id_convocatoria,
                "convocatoria": vacante.convocatoria.nombre if vacante.convocatoria else None,
                "observaciones": vacante.observaciones,
                "plan_trabajo": _plan_trabajo_vacante(db, vacante),
                "formato_plan_trabajo": _formato_plan_response(_formato_plan_aplicable(db, vacante.id_convocatoria)),
                "visible_padron": (
                    estado_proceso["puede_capturar_vacantes"]
                    and vacante.estado_vacante == "Activa"
                ),
            }
            for vacante in vacantes
        ],
    }


@router.get("/me/vacantes")
def listar_mis_vacantes_unidad(
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return listar_vacantes_unidad(id_empresa, db)


@router.get("/catalogos/convocatorias")
def listar_convocatorias_unidad(db: Session = Depends(obtener_db)):
    convocatorias = (
        db.query(ConvocatoriaModel)
        .filter(ConvocatoriaModel.estado == "Activa")
        .order_by(ConvocatoriaModel.fecha_inicio_general.desc(), ConvocatoriaModel.id_convocatoria.desc())
        .all()
    )
    return [_convocatoria_basica_response(convocatoria) for convocatoria in convocatorias]


@router.get("/catalogos/tipos-practica")
def listar_tipos_practica_unidad(db: Session = Depends(obtener_db)):
    tipos = (
        db.query(TipoPracticaModel)
        .filter(TipoPracticaModel.activo.is_(True))
        .order_by(TipoPracticaModel.orden.asc(), TipoPracticaModel.nombre.asc())
        .all()
    )
    return [
        {
            "id_tipo_practica": tipo.id_tipo_practica,
            "nombre": tipo.nombre,
            "horas_requeridas": tipo.horas_requeridas,
            "activo": bool(tipo.activo),
        }
        for tipo in tipos
    ]


@router.get("/catalogos/carreras")
def listar_carreras_unidad(db: Session = Depends(obtener_db)):
    carreras = (
        db.query(CarreraModel)
        .filter(CarreraModel.estado == "Activa")
        .order_by(CarreraModel.nombre.asc())
        .all()
    )
    return [
        {
            "id_carrera": carrera.id_carrera,
            "nombre": carrera.nombre,
            "tipo_periodo": carrera.tipo_periodo,
            "estado": carrera.estado,
        }
        for carrera in carreras
    ]


@router.get("/convocatorias-disponibles")
def listar_convocatorias_disponibles_unidad(
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    convocatorias = (
        db.query(ConvocatoriaModel)
        .filter(ConvocatoriaModel.estado == "Activa")
        .order_by(ConvocatoriaModel.fecha_inicio_empresas.asc(), ConvocatoriaModel.fecha_inicio_general.asc())
        .all()
    )
    activas = []
    proximas = []
    for convocatoria in convocatorias:
        if not _calendario_operativo_valido(convocatoria):
            continue
        item = _convocatoria_disponible_response(db, id_empresa, convocatoria)
        if item["etapa_actual"] == "Próxima":
            proximas.append(item)
        elif item["etapa_actual"] == "Empresas":
            activas.append(item)
    return {"convocatorias": [*activas, *proximas]}


def _solicitar_participacion_convocatoria(
    datos: SolicitarParticipacionRequest,
    id_empresa: int,
    db: Session,
):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    if empresa.estado_empresa not in {"Pendiente", "Activa"}:
        raise HTTPException(status_code=400, detail="La empresa debe estar aceptada para seleccionar convocatoria.")
    estado_proceso = _estado_vacantes_empresa(db, empresa)
    if not estado_proceso["documentacion_legal_aprobada"]:
        raise HTTPException(status_code=400, detail="Necesitas documentación legal aprobada para seleccionar convocatoria.")
    if not estado_proceso["tramite_vigente"] and empresa.tipo_tramite == "Vinculacion":
        raise HTTPException(status_code=400, detail="Necesitas vinculación aprobada para seleccionar convocatoria.")
    if not estado_proceso["tramite_vigente"]:
        raise HTTPException(status_code=400, detail="Necesitas convenio vigente para seleccionar convocatoria.")
    convocatoria = (
        db.query(ConvocatoriaModel)
        .filter(ConvocatoriaModel.id_convocatoria == datos.id_convocatoria, ConvocatoriaModel.estado != "Cerrada")
        .first()
    )
    if convocatoria is None:
        raise HTTPException(status_code=404, detail="Convocatoria disponible no encontrada")
    if not _calendario_operativo_valido(convocatoria):
        raise HTTPException(status_code=400, detail="La convocatoria no tiene calendario operativo válido.")
    existente = (
        db.query(ParticipacionEmpresaConvocatoriaModel)
        .filter(
            ParticipacionEmpresaConvocatoriaModel.id_empresa == id_empresa,
            ParticipacionEmpresaConvocatoriaModel.id_convocatoria == datos.id_convocatoria,
        )
        .first()
    )
    if existente is not None:
        if existente.estado == "Rechazada":
            raise HTTPException(status_code=400, detail=existente.motivo_rechazo or "La inscripción fue rechazada para esta convocatoria.")
        return {
            "mensaje": "Convocatoria seleccionada. Ahora puedes capturar tu vacante para revisión.",
            "id_participacion": existente.id_participacion,
            "estado": existente.estado,
            "id_convocatoria": existente.id_convocatoria,
        }
    participacion = ParticipacionEmpresaConvocatoriaModel(
        id_empresa=id_empresa,
        id_convocatoria=datos.id_convocatoria,
        estado="Pendiente",
        observaciones=datos.observaciones,
    )
    db.add(participacion)
    db.commit()
    db.refresh(participacion)
    return {
        "mensaje": "Convocatoria seleccionada. Ahora puedes capturar tu vacante para revisión.",
        "id_participacion": participacion.id_participacion,
        "estado": participacion.estado,
        "id_convocatoria": participacion.id_convocatoria,
    }


@router.post("/participaciones")
def solicitar_participacion_convocatoria(
    datos: SolicitarParticipacionRequest,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return _solicitar_participacion_convocatoria(datos, id_empresa, db)


@router.post("/me/participaciones")
def solicitar_mi_participacion_convocatoria(
    datos: SolicitarParticipacionRequest,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return _solicitar_participacion_convocatoria(datos, id_empresa, db)


@router.post("/{id_empresa:int}/vacantes")
def crear_vacante_unidad(
    id_empresa: int,
    datos: CrearVacanteUnidadRequest,
    db: Session = Depends(obtener_db),
):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    if empresa.estado_empresa not in {"Pendiente", "Activa"}:
        raise HTTPException(
            status_code=400,
            detail="La empresa debe estar aceptada antes de registrar vacantes",
        )
    estado_proceso = _estado_vacantes_empresa(db, empresa)
    if not estado_proceso["puede_capturar_vacantes"]:
        raise HTTPException(
            status_code=400,
            detail=estado_proceso["motivo_bloqueo"] or "Necesitas documentación legal aprobada y trámite vigente antes de capturar vacantes.",
        )
    tipos_vacante = _normalizar_tipos_vacante(datos)
    _validar_tipos_vacante(db, tipos_vacante)
    cupos_total = sum(tipo.cupos for tipo in tipos_vacante)
    convocatoria = (
        db.query(ConvocatoriaModel)
        .filter(ConvocatoriaModel.id_convocatoria == datos.id_convocatoria, ConvocatoriaModel.estado != "Cerrada")
        .first()
    )
    if convocatoria is None:
        raise HTTPException(status_code=404, detail="Convocatoria disponible no encontrada")
    if not _calendario_operativo_valido(convocatoria):
        raise HTTPException(status_code=400, detail="La convocatoria no tiene calendario operativo válido.")
    ids_carrera = _validar_carreras_vacante(db, datos.aplica_todas_carreras, datos.ids_carrera, convocatoria.tipo_periodo)
    participacion = (
        db.query(ParticipacionEmpresaConvocatoriaModel)
        .filter(
            ParticipacionEmpresaConvocatoriaModel.id_empresa == id_empresa,
            ParticipacionEmpresaConvocatoriaModel.id_convocatoria == datos.id_convocatoria,
        )
        .first()
    )
    if participacion is None:
        participacion = ParticipacionEmpresaConvocatoriaModel(
            id_empresa=id_empresa,
            id_convocatoria=datos.id_convocatoria,
            estado="Pendiente",
            observaciones="Inscripción registrada automáticamente al capturar vacante.",
        )
        db.add(participacion)
        db.flush()
    elif participacion.estado == "Rechazada":
        raise HTTPException(status_code=400, detail=participacion.motivo_rechazo or "La inscripción fue rechazada para esta convocatoria.")
    existente = (
        db.query(VacanteModel)
        .filter(VacanteModel.id_empresa == id_empresa, VacanteModel.id_convocatoria == datos.id_convocatoria)
        .first()
    )
    if existente is not None:
        raise HTTPException(status_code=400, detail="La empresa ya tiene una vacante registrada para esta convocatoria.")
    id_tipo_practica_respaldo = tipos_vacante[0].id_tipo_practica

    vacante = VacanteModel(
        id_empresa=id_empresa,
        id_convocatoria=datos.id_convocatoria,
        id_tipo_practica=id_tipo_practica_respaldo,
        titulo=datos.titulo.strip(),
        descripcion=datos.descripcion,
        actividades=datos.actividades,
        requisitos=datos.requisitos,
        cupos=cupos_total,
        aplica_todas_carreras=datos.aplica_todas_carreras,
        periodo=convocatoria.tipo_periodo,
        estado_vacante="Con observaciones",
        observaciones="Debes subir el Plan de Trabajo antes de enviar la vacante.",
    )
    db.add(vacante)
    db.flush()
    for tipo in tipos_vacante:
        db.add(
            VacanteTipoPracticaModel(
                id_vacante=vacante.id_vacante,
                id_tipo_practica=tipo.id_tipo_practica,
                cupos=tipo.cupos,
                activo=True,
            )
        )
    for id_carrera in ids_carrera:
        db.add(VacanteCarreraModel(id_vacante=vacante.id_vacante, id_carrera=id_carrera))
    db.commit()
    db.refresh(vacante)
    return {
        "id_vacante": vacante.id_vacante,
        "id_empresa": vacante.id_empresa,
        "id_convocatoria": vacante.id_convocatoria,
        "id_tipo_practica": vacante.id_tipo_practica,
        "aplica_todas_carreras": bool(vacante.aplica_todas_carreras),
        "carreras": _carreras_vacante(db, vacante),
        "tipos_practica": _tipos_practica_vacante(db, vacante),
        "titulo": vacante.titulo,
        "descripcion": vacante.descripcion,
        "actividades": vacante.actividades,
        "requisitos": vacante.requisitos,
        "cupos": vacante.cupos,
        "estado_vacante": vacante.estado_vacante,
        "periodo": vacante.periodo,
        "mensaje": "Vacante registrada correctamente. Coordinación de Unidades revisará la información.",
    }


@router.post("/me/vacantes")
def crear_mi_vacante_unidad(
    datos: CrearVacanteUnidadRequest,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return crear_vacante_unidad(id_empresa, datos, db)


@router.get("/vacantes/formatos-plan-trabajo")
def obtener_formato_plan_trabajo_unidad(
    id_convocatoria: int | None = None,
    db: Session = Depends(obtener_db),
):
    return _formato_plan_response(_formato_plan_aplicable(db, id_convocatoria))


@router.get("/vacantes/formatos-plan-trabajo/{id_formato_plan:int}/archivo")
def descargar_formato_plan_trabajo_unidad(
    id_formato_plan: int,
    db: Session = Depends(obtener_db),
):
    formato = (
        db.query(FormatoPlanTrabajoVacanteModel)
        .filter(FormatoPlanTrabajoVacanteModel.id_formato_plan == id_formato_plan)
        .first()
    )
    if formato is None:
        raise HTTPException(status_code=404, detail="Formato de Plan de Trabajo no encontrado.")
    ruta = resolver_archivo_en_uploads(formato.ruta_archivo, UPLOADS_DIR)
    nombre = nombre_descarga_seguro(formato.nombre_archivo, "formato_plan_trabajo.pdf")
    media_type = mimetypes.guess_type(nombre)[0] or "application/octet-stream"
    return FileResponse(ruta, media_type=media_type, filename=nombre)


@router.get("/vacantes/{id_vacante:int}/detalle")
def obtener_detalle_vacante_unidad(
    id_vacante: int,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    vacante = (
        db.query(VacanteModel)
        .filter(VacanteModel.id_vacante == id_vacante, VacanteModel.id_empresa == id_empresa)
        .first()
    )
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada para esta empresa.")
    return _vacante_detalle_response(db, vacante)


@router.post("/vacantes/{id_vacante:int}/plan-trabajo")
def subir_plan_trabajo_vacante(
    id_vacante: int,
    archivo: UploadFile | None = File(None),
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    vacante = (
        db.query(VacanteModel)
        .filter(VacanteModel.id_vacante == id_vacante, VacanteModel.id_empresa == id_empresa)
        .first()
    )
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada para esta empresa.")
    _asegurar_vacante_editable_empresa(vacante)

    if archivo is None or not archivo.filename:
        raise HTTPException(status_code=400, detail="Debes seleccionar el Plan de Trabajo lleno.")

    contenido = archivo.file.read()
    validar_documento_liberacion(contenido, archivo.filename, getattr(archivo, "content_type", None))
    archivo.file.seek(0)
    nombre_seguro = normalizar_nombre_archivo(archivo.filename, "plan_trabajo.pdf")
    carpeta = UPLOAD_PLANES_DIR / f"empresa_{id_empresa}" / f"vacante_{id_vacante}"
    carpeta.mkdir(parents=True, exist_ok=True)
    ruta = carpeta / f"{uuid4().hex}_{nombre_seguro}"
    ruta.write_bytes(contenido)

    (
        db.query(DocumentoVacanteModel)
        .filter(
            DocumentoVacanteModel.id_vacante == id_vacante,
            DocumentoVacanteModel.tipo_documento == "Plan de trabajo",
            DocumentoVacanteModel.activo.is_(True),
        )
        .update({DocumentoVacanteModel.activo: False}, synchronize_session=False)
    )
    documento = DocumentoVacanteModel(
        id_vacante=id_vacante,
        tipo_documento="Plan de trabajo",
        nombre_archivo=nombre_seguro,
        ruta_archivo=str(ruta),
        estado_documento="Pendiente",
        activo=True,
    )
    db.add(documento)
    db.flush()
    registrar_bitacora(
        db,
        None,
        "Subir Plan de Trabajo",
        "vacantes",
        f"Plan de Trabajo cargado para vacante {id_vacante}.",
        "documento_vacante",
        documento.id_documento_vacante,
    )
    db.commit()
    db.refresh(documento)
    return _plan_trabajo_vacante(db, vacante)


@router.get("/vacantes/{id_vacante:int}/plan-trabajo/archivo")
def descargar_plan_trabajo_vacante(
    id_vacante: int,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    vacante = (
        db.query(VacanteModel)
        .filter(VacanteModel.id_vacante == id_vacante, VacanteModel.id_empresa == id_empresa)
        .first()
    )
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada para esta empresa.")
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
        raise HTTPException(status_code=404, detail="Plan de Trabajo no encontrado.")
    ruta = resolver_archivo_en_uploads(documento.ruta_archivo, UPLOADS_DIR)
    nombre = nombre_descarga_seguro(documento.nombre_archivo, "plan_trabajo.pdf")
    media_type = mimetypes.guess_type(nombre)[0] or "application/octet-stream"
    return FileResponse(ruta, media_type=media_type, filename=nombre)


@router.put("/vacantes/{id_vacante:int}")
def editar_vacante_unidad(
    id_vacante: int,
    datos: CrearVacanteUnidadRequest,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    vacante = (
        db.query(VacanteModel)
        .filter(VacanteModel.id_vacante == id_vacante, VacanteModel.id_empresa == id_empresa)
        .first()
    )
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada para esta empresa.")
    _asegurar_vacante_editable_empresa(vacante)
    if datos.id_convocatoria != vacante.id_convocatoria:
        raise HTTPException(status_code=400, detail="No se puede cambiar la convocatoria de una vacante existente.")

    tipos_vacante = _normalizar_tipos_vacante(datos)
    _validar_tipos_vacante(db, tipos_vacante)
    ids_carrera = _validar_carreras_vacante(db, datos.aplica_todas_carreras, datos.ids_carrera, vacante.convocatoria.tipo_periodo)
    asignaciones_activas = (
        db.query(func.count(AsignacionModel.id_asignacion))
        .filter(AsignacionModel.id_vacante == id_vacante, AsignacionModel.estado_asignacion == "Activa")
        .scalar()
        or 0
    )

    vacante.titulo = datos.titulo.strip()
    vacante.descripcion = datos.descripcion
    vacante.actividades = datos.actividades
    vacante.requisitos = datos.requisitos
    vacante.aplica_todas_carreras = datos.aplica_todas_carreras
    if asignaciones_activas == 0:
        vacante.id_tipo_practica = tipos_vacante[0].id_tipo_practica
        vacante.cupos = sum(tipo.cupos for tipo in tipos_vacante)
        db.query(VacanteTipoPracticaModel).filter(VacanteTipoPracticaModel.id_vacante == id_vacante).delete(synchronize_session=False)
        for tipo in tipos_vacante:
            db.add(
                VacanteTipoPracticaModel(
                    id_vacante=id_vacante,
                    id_tipo_practica=tipo.id_tipo_practica,
                    cupos=tipo.cupos,
                    activo=True,
                )
            )
    db.query(VacanteCarreraModel).filter(VacanteCarreraModel.id_vacante == id_vacante).delete(synchronize_session=False)
    for id_carrera in ids_carrera:
        db.add(VacanteCarreraModel(id_vacante=id_vacante, id_carrera=id_carrera))
    db.commit()
    db.refresh(vacante)
    return _vacante_detalle_response(db, vacante)


@router.post("/vacantes/{id_vacante:int}/reenviar")
def reenviar_vacante_unidad(
    id_vacante: int,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    vacante = (
        db.query(VacanteModel)
        .filter(VacanteModel.id_vacante == id_vacante, VacanteModel.id_empresa == id_empresa)
        .first()
    )
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada para esta empresa.")
    _asegurar_vacante_editable_empresa(vacante)
    if _plan_trabajo_vacante(db, vacante) is None:
        raise HTTPException(status_code=400, detail="Debes subir el Plan de Trabajo antes de enviar la vacante.")
    if not _tipos_practica_vacante(db, vacante):
        raise HTTPException(status_code=400, detail="La vacante debe tener al menos un tipo de prÃ¡ctica.")
    if not vacante.aplica_todas_carreras and not _carreras_vacante(db, vacante):
        raise HTTPException(status_code=400, detail="Selecciona al menos una carrera o marca Todas las carreras.")

    vacante.estado_vacante = "Pendiente"
    vacante.fecha_revision = None
    vacante.revisada_por = None
    vacante.observaciones = None
    notificar_roles(
        db,
        ["Coordinador de Unidades Receptoras", "Administrador"],
        "Vacante reenviada a revisiÃ³n",
        f"La empresa {vacante.empresa.nombre_empresa if vacante.empresa else id_empresa} reenviÃ³ la vacante {vacante.titulo}.",
    )
    registrar_bitacora(
        db,
        None,
        "Reenviar vacante",
        "vacantes",
        f"Vacante {id_vacante} reenviada a revisiÃ³n.",
        "vacante",
        id_vacante,
    )
    db.commit()
    db.refresh(vacante)
    return {"mensaje": "Vacante reenviada a revisiÃ³n.", "estado_vacante": vacante.estado_vacante}


@router.post("/vacantes/{id_vacante:int}/solicitar-ampliacion-cupos")
def solicitar_ampliacion_cupos_vacante(
    id_vacante: int,
    datos: SolicitarAmpliacionCuposRequest,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    motivo = " ".join(datos.motivo.split())
    if len(motivo) < 10:
        raise HTTPException(status_code=422, detail="Ingresa un motivo claro para solicitar mas cupos.")

    vacante = (
        db.query(VacanteModel)
        .filter(VacanteModel.id_vacante == id_vacante, VacanteModel.id_empresa == id_empresa)
        .first()
    )
    if vacante is None:
        raise HTTPException(status_code=404, detail="Vacante no encontrada para esta empresa.")
    if vacante.estado_vacante == "Cerrada":
        raise HTTPException(status_code=400, detail="No se puede solicitar ampliacion para una vacante cerrada.")
    if vacante.estado_vacante in {"Rechazada", "Con observaciones"}:
        raise HTTPException(status_code=400, detail="Primero corrige y reenvia la vacante antes de solicitar mas cupos.")

    detalles = datos.detalles or []
    if not detalles and datos.id_tipo_practica is not None and datos.cupos_solicitados is not None:
        detalles = [TipoPracticaVacanteRequest(id_tipo_practica=datos.id_tipo_practica, cupos=datos.cupos_solicitados)]
    if not detalles:
        raise HTTPException(status_code=400, detail="Indica los cupos adicionales por tipo de practica.")

    tipos_config = {
        config.id_tipo_practica
        for config in db.query(VacanteTipoPracticaModel)
        .filter(
            VacanteTipoPracticaModel.id_vacante == id_vacante,
            VacanteTipoPracticaModel.activo.is_(True),
        )
        .all()
    }
    detalles_por_tipo: dict[int, int] = {}
    for detalle in detalles:
        if detalle.cupos <= 0:
            raise HTTPException(status_code=400, detail="Los cupos solicitados deben ser mayores a cero.")
        if detalle.id_tipo_practica in detalles_por_tipo:
            raise HTTPException(status_code=400, detail="No repitas el mismo tipo de practica en una solicitud.")
        if detalle.id_tipo_practica not in tipos_config:
            raise HTTPException(status_code=400, detail="El tipo de practica no pertenece a esta vacante.")
        detalles_por_tipo[detalle.id_tipo_practica] = detalle.cupos

    pendiente = (
        db.query(SolicitudAmpliacionCuposVacanteModel)
        .filter(
            SolicitudAmpliacionCuposVacanteModel.id_vacante == id_vacante,
            SolicitudAmpliacionCuposVacanteModel.estado == "Pendiente",
        )
        .first()
    )
    if pendiente is not None:
        raise HTTPException(status_code=400, detail="Ya existe una solicitud de ampliacion pendiente para esta vacante.")

    solicitud = SolicitudAmpliacionCuposVacanteModel(
        id_vacante=id_vacante,
        id_tipo_practica=next(iter(detalles_por_tipo.keys())),
        cupos_solicitados=sum(detalles_por_tipo.values()),
        motivo=motivo,
        estado="Pendiente",
    )
    db.add(solicitud)
    db.flush()
    for id_tipo_practica, cupos_solicitados in detalles_por_tipo.items():
        db.add(
            SolicitudAmpliacionCuposVacanteDetalleModel(
                id_solicitud_ampliacion=solicitud.id_solicitud_ampliacion,
                id_tipo_practica=id_tipo_practica,
                cupos_solicitados=cupos_solicitados,
                estado="Pendiente",
            )
        )
    notificar_roles(
        db,
        ["Coordinador de Unidades Receptoras", "Administrador"],
        "Solicitud de ampliacion de cupos",
        f"La empresa {vacante.id_empresa} solicito ampliar cupos para la vacante {vacante.titulo}.",
    )
    db.commit()
    db.refresh(solicitud)
    registrar_bitacora(
        db,
        None,
        "Solicitar ampliacion de cupos",
        "vacantes",
        f"Solicitud {solicitud.id_solicitud_ampliacion} creada para vacante {vacante.id_vacante}.",
        "solicitud_ampliacion_cupos_vacante",
        solicitud.id_solicitud_ampliacion,
    )
    return {
        "mensaje": "Solicitud de ampliacion enviada a Coordinacion de Unidades.",
        "id_solicitud_ampliacion": solicitud.id_solicitud_ampliacion,
        "estado": solicitud.estado,
        "detalles": [
            {"id_tipo_practica": id_tipo_practica, "cupos_solicitados": cupos}
            for id_tipo_practica, cupos in detalles_por_tipo.items()
        ],
    }
