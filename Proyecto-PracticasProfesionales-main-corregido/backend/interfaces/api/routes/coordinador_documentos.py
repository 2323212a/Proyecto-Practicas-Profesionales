from __future__ import annotations

import base64
import mimetypes
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.services.auditoria_service import registrar_bitacora
from app.services.notificacion_service import crear_notificacion, notificar_roles
from app.services.convocatoria_rules_service import validar_etapa_actual
from app.services.documentacion_flujo_service import habilitar_documentacion_asignacion, listar_alumnos_revision, serializar_documentacion
from app.services.upload_security import normalizar_nombre_archivo, resolver_archivo_en_uploads, validar_formato_institucional
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import obtener_usuario_actual, requerir_roles
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.documento import DocumentoModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.expediente import ExpedienteModel
from infrastructure.persistence.models.formato_documento import FormatoDocumentoModel
from infrastructure.persistence.models.observacion import ObservacionModel
from infrastructure.persistence.models.seleccion_empresa import SeleccionEmpresaModel
from infrastructure.persistence.models.tipo_documento import TipoDocumentoModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.persistence.models.vacante import VacanteModel


router = APIRouter(
    prefix="/coordinador/documentos",
    tags=["Coordinador - Documentos"],
)
UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads" / "formatos"
UPLOADS_DIR = Path(__file__).resolve().parents[3] / "uploads"


class TipoDocumentoResumen(BaseModel):
    id_tipo_documento: int
    nombre_documento: str
    descripcion: str | None = None
    etapa: str
    obligatorio: bool
    requiere_formato: bool

    model_config = ConfigDict(from_attributes=True)


class DocumentoRevisionResponse(BaseModel):
    id_documento: int
    id_expediente: int
    id_tipo_documento: int
    tipo_documento: str
    etapa: str
    nombre_archivo: str
    ruta_archivo: str
    url: str
    estado_documento: str
    fecha_carga: str
    validacion_automatica_estado: str
    requiere_validacion_automatica: bool
    id_alumno: int
    alumno: str
    matricula: str
    carrera: str
    estado_expediente: str
    estado_alumno: str
    ultima_observacion: str | None = None


class FormatoDocumentoResponse(BaseModel):
    id_formato: int
    id_tipo_documento: int
    tipo_documento: str
    etapa: str
    nombre_archivo: str
    url: str
    mime_type: str
    descripcion: str | None = None
    activo: bool
    fecha_actualizacion: str


class AlumnoRevisionResponse(BaseModel):
    id_alumno: int
    id_expediente: int | None = None
    alumno: str
    matricula: str
    carrera: str
    estado_expediente: str
    estado_alumno: str
    pendientes: int
    completados: int
    observados: int
    faltantes: int
    enviados: int
    total: int
    estado_recepcion: str


class RevisionDocumentalResponse(BaseModel):
    alumnos: list[AlumnoRevisionResponse]
    documentos: list[DocumentoRevisionResponse]
    formatos: list[FormatoDocumentoResponse]
    tipos_documento: list[TipoDocumentoResumen]


class CambiarEstadoDocumentoRequest(BaseModel):
    estado: str
    comentario: str | None = None
    id_usuario: int = 1


class SubirFormatoRequest(BaseModel):
    id_tipo_documento: int
    nombre_archivo: str
    contenido_base64: str
    mime_type: str
    descripcion: str | None = None

ETAPAS_HABILITANTES_SELECCION = {
    "registro",
    "elegibilidad",
    "expediente",
}

def _normalizar_etapa(etapa: str | None) -> str:
    return (etapa or "").strip().lower().replace(" ", "_")


def _nombre_perfil(perfil, fallback: str = "Sin nombre") -> str:
    return " ".join(
        parte
        for parte in [
            getattr(perfil, "nombre", None),
            getattr(perfil, "apellido_paterno", None),
            getattr(perfil, "apellido_materno", None),
        ]
        if parte
    ) or fallback


def _safe_filename(filename: str) -> str:
    return normalizar_nombre_archivo(filename, "formato")


def _tipo_observacion_revision(estado: str) -> str:
    if estado == "Rechazado":
        return "Documento rechazado"
    if estado == "Observado":
        return "Documento observado"
    return "RevisiÃ³n manual"


def _decode_base64(content: str) -> bytes:
    payload = content.split(",", 1)[1] if "," in content else content
    try:
        return base64.b64decode(payload, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Archivo base64 invalido") from exc


def _formato_response(formato: FormatoDocumentoModel) -> FormatoDocumentoResponse:
    tipo = formato.tipo_documento
    return FormatoDocumentoResponse(
        id_formato=formato.id_formato,
        id_tipo_documento=formato.id_tipo_documento,
        tipo_documento=tipo.nombre_documento,
        etapa=tipo.etapa,
        nombre_archivo=formato.nombre_archivo,
        url=f"/coordinador/documentos/formatos/{formato.id_formato}/archivo",
        mime_type=formato.mime_type,
        descripcion=formato.descripcion,
        activo=formato.activo,
        fecha_actualizacion=formato.fecha_actualizacion.isoformat(),
    )


def _listar_formatos(db: Session) -> list[FormatoDocumentoResponse]:
    formatos = (
        db.query(FormatoDocumentoModel)
        .filter(FormatoDocumentoModel.activo.is_(True))  # noqa: E712
        .order_by(FormatoDocumentoModel.fecha_actualizacion.desc())
        .all()
    )
    return [_formato_response(formato) for formato in formatos]


def _documento_response(db: Session, documento: DocumentoModel) -> DocumentoRevisionResponse:
    alumno = documento.expediente.alumno
    ultima_observacion = (
        db.query(ObservacionModel)
        .filter(ObservacionModel.id_documento == documento.id_documento)
        .order_by(ObservacionModel.fecha_observacion.desc())
        .first()
    )
    return DocumentoRevisionResponse(
        id_documento=documento.id_documento,
        id_expediente=documento.id_expediente,
        id_tipo_documento=documento.id_tipo_documento,
        tipo_documento=documento.tipo_documento.nombre_documento,
        etapa=documento.tipo_documento.etapa,
        nombre_archivo=documento.nombre_archivo,
        ruta_archivo=documento.ruta_archivo,
        url=f"/coordinador/documentos/flujo/{documento.id_documento}/archivo" if documento.ruta_archivo else None,
        estado_documento=documento.estado_documento,
        fecha_carga=documento.fecha_carga.isoformat(),
        validacion_automatica_estado=documento.validacion_automatica_estado,
        requiere_validacion_automatica=documento.requiere_validacion_automatica,
        id_alumno=alumno.id_alumno,
        alumno=_nombre_perfil(alumno, "Alumno"),
        matricula=alumno.matricula,
        carrera=alumno.carrera.nombre,
        estado_expediente=documento.expediente.estado_expediente,
        estado_alumno=alumno.estado_alumno,
        ultima_observacion=ultima_observacion.descripcion if ultima_observacion else None,
    )


def _file_response_segura(ruta_archivo: str | None, nombre_archivo: str | None, media_type: str | None = None):
    ruta = resolver_archivo_en_uploads(ruta_archivo, UPLOADS_DIR)
    tipo = media_type or mimetypes.guess_type(nombre_archivo or ruta.name)[0] or "application/octet-stream"
    return FileResponse(ruta, media_type=tipo, filename=nombre_archivo or ruta.name)


def _alumno_revision_response(alumno: AlumnoModel, tipos: list[TipoDocumentoModel]) -> AlumnoRevisionResponse:
    expediente = _ultimo_expediente(alumno)
    documentos = list(expediente.documentos) if expediente else []
    obligatorios = [tipo for tipo in tipos if tipo.obligatorio]
    total = len(obligatorios)
    ids_obligatorios = {tipo.id_tipo_documento for tipo in obligatorios}
    documentos_obligatorios = [
        documento for documento in documentos if documento.id_tipo_documento in ids_obligatorios
    ]
    pendientes = sum(1 for documento in documentos_obligatorios if documento.estado_documento == "Pendiente")
    completados = sum(1 for documento in documentos_obligatorios if documento.estado_documento == "Aprobado")
    observados = sum(
        1 for documento in documentos_obligatorios if documento.estado_documento in {"Observado", "Rechazado"}
    )
    faltantes = max(total - len(documentos_obligatorios), 0)
    enviados = len(documentos)

    if enviados == 0:
        estado_recepcion = "Sin documentos enviados"
    elif total > 0 and completados == total:
        estado_recepcion = "Completado"
    else:
        estado_recepcion = "Pendiente"

    return AlumnoRevisionResponse(
        id_alumno=alumno.id_alumno,
        id_expediente=expediente.id_expediente if expediente else None,
        alumno=_nombre_completo_alumno(alumno),
        matricula=alumno.matricula,
        carrera=alumno.carrera.nombre if alumno.carrera else "Sin carrera",
        estado_expediente=expediente.estado_expediente if expediente else "Sin expediente",
        estado_alumno=alumno.estado_alumno,
        pendientes=pendientes,
        completados=completados,
        observados=observados,
        faltantes=faltantes,
        enviados=enviados,
        total=total,
        estado_recepcion=estado_recepcion,
    )


def _es_etapa_habilitante(etapa: str | None) -> bool:
    return _normalizar_etapa(etapa) in ETAPAS_HABILITANTES_SELECCION


def _nombre_completo_alumno(alumno: AlumnoModel) -> str:
    return _nombre_perfil(alumno, "Alumno")


def _ultimo_expediente(alumno: AlumnoModel) -> ExpedienteModel | None:
    if not alumno.expedientes:
        return None
    return sorted(
        alumno.expedientes,
        key=lambda expediente: expediente.fecha_creacion,
        reverse=True,
    )[0]


def _documentos_por_tipo(expediente: ExpedienteModel | None) -> dict[int, DocumentoModel]:
    if expediente is None:
        return {}
    return {documento.id_tipo_documento: documento for documento in expediente.documentos}


def _resumen_fases_alumno(alumno: AlumnoModel, tipos: list[TipoDocumentoModel]) -> dict:
    expediente = _ultimo_expediente(alumno)
    documentos = _documentos_por_tipo(expediente)
    obligatorios = [tipo for tipo in tipos if tipo.obligatorio]
    habilitantes = [
        tipo for tipo in obligatorios if _normalizar_etapa(tipo.etapa) in {"registro", "elegibilidad", "expediente"}
    ]
    if not habilitantes:
        habilitantes = obligatorios

    ids_habilitantes = {tipo.id_tipo_documento for tipo in habilitantes}
    docs_habilitantes = [documentos.get(id_tipo) for id_tipo in ids_habilitantes]
    docs_cargados = [documento for documento in documentos.values() if documento.nombre_archivo]

    aprobados = sum(1 for documento in docs_cargados if documento.estado_documento == "Aprobado")
    revision = sum(1 for documento in docs_cargados if documento.estado_documento == "Pendiente")
    observados = sum(1 for documento in docs_cargados if documento.estado_documento in {"Observado", "Rechazado"})
    faltantes = max(len(obligatorios) - len([doc for doc in docs_cargados if doc.id_tipo_documento in {t.id_tipo_documento for t in obligatorios}]), 0)
    inicial_aprobado = bool(ids_habilitantes) and all(
        documento is not None and documento.estado_documento == "Aprobado"
        for documento in docs_habilitantes
    )
    seleccion_realizada = bool(alumno.selecciones_empresa)
    asignacion = next(
        (item for item in sorted(alumno.asignaciones, key=lambda row: row.fecha_asignacion, reverse=True)),
        None,
    )

    fase = "Carga inicial"
    siguiente_paso = "Esperar carga de documentos"
    prioridad = 5
    estado_documental = "Pendiente"

    if observados > 0:
        estado_documental = "Con observaciones"
        fase = "Correccion documental"
        siguiente_paso = "Esperar correccion del alumno"
        prioridad = 1
    elif revision > 0:
        estado_documental = "En revision"
        fase = "Revision documental"
        siguiente_paso = "Revisar documentos cargados"
        prioridad = 2
    elif inicial_aprobado and not seleccion_realizada:
        estado_documental = "Expediente inicial aprobado"
        fase = "Seleccion de empresa"
        siguiente_paso = "Habilitar o revisar seleccion de empresa"
        prioridad = 3
    elif inicial_aprobado and seleccion_realizada and asignacion is None:
        estado_documental = "Seleccion registrada"
        fase = "Asignacion"
        siguiente_paso = "Confirmar empresa y asesor interno"
        prioridad = 4
    elif asignacion is not None:
        estado_documental = "Asignado"
        fase = "Seguimiento de practicas"
        siguiente_paso = "Dar seguimiento a reportes y horas"
        prioridad = 6

    horas_aprobadas = 0
    if asignacion is not None:
        horas_aprobadas = float(
            sum(
                hora.horas_realizadas
                for hora in asignacion.horas
                if hora.estado_horas == "Aprobada"
            )
        )

    return {
        "expediente": expediente,
        "asignacion": asignacion,
        "resumen": {
            "aprobados": aprobados,
            "revision": revision,
            "observados": observados,
            "faltantes": faltantes,
            "cargados": len(docs_cargados),
            "total": len(obligatorios),
        },
        "fase": fase,
        "estado_documental": estado_documental,
        "siguiente_paso": siguiente_paso,
        "prioridad": prioridad,
        "inicial_aprobado": inicial_aprobado,
        "seleccion_realizada": seleccion_realizada,
        "horas_aprobadas": horas_aprobadas,
    }


def _alumno_gestion_response(alumno: AlumnoModel, tipos: list[TipoDocumentoModel]) -> dict:
    avance = _resumen_fases_alumno(alumno, tipos)
    expediente = avance["expediente"]
    asignacion = avance["asignacion"]
    return {
        "id_alumno": alumno.id_alumno,
        "id_expediente": expediente.id_expediente if expediente else None,
        "nombre": _nombre_completo_alumno(alumno),
        "correo": alumno.usuario.correo if alumno.usuario else None,
        "matricula": alumno.matricula,
        "semestre": alumno.semestre,
        "grupo": alumno.grupo,
        "carrera": alumno.carrera.nombre if alumno.carrera else "Sin carrera",
        "estado_alumno": alumno.estado_alumno,
        "estado_expediente": expediente.estado_expediente if expediente else "Sin expediente",
        "empresa": asignacion.empresa.nombre_empresa if asignacion and asignacion.empresa else "Sin asignar",
        "asesor": (
            _nombre_perfil(asignacion.asesor, "Sin asignar")
            if asignacion and asignacion.asesor
            else "Sin asignar"
        ),
        "tipo_asignacion": asignacion.tipo_asignacion if asignacion else "Sin asignacion",
        "horas_aprobadas": avance["horas_aprobadas"],
        "fase": avance["fase"],
        "estado_documental": avance["estado_documental"],
        "siguiente_paso": avance["siguiente_paso"],
        "prioridad": avance["prioridad"],
        "inicial_aprobado": avance["inicial_aprobado"],
        "seleccion_realizada": avance["seleccion_realizada"],
        "resumen": avance["resumen"],
    }


@router.get(
    "/dashboard",
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)
def obtener_dashboard_coordinador_documental(db: Session = Depends(obtener_db)):
    tipos = db.query(TipoDocumentoModel).filter(TipoDocumentoModel.obligatorio.is_(True)).all()  # noqa: E712
    alumnos = (
        db.query(AlumnoModel)
        .join(UsuarioModel, UsuarioModel.id_usuario == AlumnoModel.id_usuario)
        .order_by(AlumnoModel.apellido_paterno.asc(), AlumnoModel.nombre.asc())
        .all()
    )
    alumnos_gestion = [_alumno_gestion_response(alumno, tipos) for alumno in alumnos]

    estado_documentos = {
        "Aprobados": 0,
        "En revision": 0,
        "Observados": 0,
        "Faltantes": 0,
    }
    for item in alumnos_gestion:
        estado_documentos["Aprobados"] += item["resumen"]["aprobados"]
        estado_documentos["En revision"] += item["resumen"]["revision"]
        estado_documentos["Observados"] += item["resumen"]["observados"]
        estado_documentos["Faltantes"] += item["resumen"]["faltantes"]

    asignaciones_activas = (
        db.query(
            AsignacionModel.id_vacante.label("id_vacante"),
            func.count(AsignacionModel.id_asignacion).label("ocupados"),
        )
        .filter(AsignacionModel.estado_asignacion == "Activa")
        .group_by(AsignacionModel.id_vacante)
        .subquery()
    )
    empresas_disponibles = (
        db.query(func.count(func.distinct(EmpresaModel.id_empresa)))
        .join(VacanteModel, VacanteModel.id_empresa == EmpresaModel.id_empresa)
        .outerjoin(asignaciones_activas, asignaciones_activas.c.id_vacante == VacanteModel.id_vacante)
        .filter(
            EmpresaModel.estado_empresa == "Activa",
            VacanteModel.estado_vacante == "Activa",
            func.coalesce(asignaciones_activas.c.ocupados, 0) < VacanteModel.cupos,
        )
        .scalar()
        or 0
    )

    return {
        "metricas": {
            "total_alumnos": len(alumnos_gestion),
            "alumnos_en_revision": sum(1 for item in alumnos_gestion if item["estado_documental"] == "En revision"),
            "docs_revisados": estado_documentos["Aprobados"] + estado_documentos["Observados"],
            "empresas_disponibles": empresas_disponibles,
            "expedientes_aprobados": sum(1 for item in alumnos_gestion if item["inicial_aprobado"]),
            "selecciones_registradas": db.query(SeleccionEmpresaModel).count(),
            "asignaciones_activas": db.query(AsignacionModel).filter(AsignacionModel.estado_asignacion == "Activa").count(),
        },
        "estado_documentos": [
            {"name": "Aprobados", "value": estado_documentos["Aprobados"], "color": "#22c55e"},
            {"name": "En revision", "value": estado_documentos["En revision"], "color": "#f59e0b"},
            {"name": "Observados", "value": estado_documentos["Observados"], "color": "#ef4444"},
            {"name": "Faltantes", "value": estado_documentos["Faltantes"], "color": "#94a3b8"},
        ],
        "expedientes_por_revisar": sorted(
            [
                item for item in alumnos_gestion
                if item["resumen"]["revision"] > 0 or item["resumen"]["observados"] > 0 or item["resumen"]["faltantes"] > 0
            ],
            key=lambda item: item["prioridad"],
        )[:6],
    }


@router.get(
    "/alumnos",
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)
def listar_alumnos_gestion_coordinador(db: Session = Depends(obtener_db)):
    tipos = db.query(TipoDocumentoModel).filter(TipoDocumentoModel.obligatorio.is_(True)).all()  # noqa: E712
    alumnos = (
        db.query(AlumnoModel)
        .join(UsuarioModel, UsuarioModel.id_usuario == AlumnoModel.id_usuario)
        .order_by(AlumnoModel.apellido_paterno.asc(), AlumnoModel.nombre.asc())
        .all()
    )
    return [_alumno_gestion_response(alumno, tipos) for alumno in alumnos]

################################################################################
def _actualizar_estado_expediente(
    db: Session,
    expediente: ExpedienteModel,
) -> bool:
    """
    Sincroniza el estado del expediente y la elegibilidad del alumno.

    Retorna True solamente cuando el alumno acaba de pasar
    de un estado no elegible a Elegible.
    """

    alumno = expediente.alumno
    era_elegible = expediente.estado_expediente == "Aprobado"

    tipos_habilitantes = [
        tipo
        for tipo in (
            db.query(TipoDocumentoModel)
            .filter(TipoDocumentoModel.obligatorio.is_(True))  # noqa: E712
            .all()
        )
        if _es_etapa_habilitante(tipo.etapa)
    ]

    # No utilizar todos los documentos obligatorios como respaldo,
    # porque podrían incluir documentos posteriores a la asignación.
    if not tipos_habilitantes:
        expediente.estado_expediente = "En Revision"

        if alumno.estado_alumno not in {"Activo", "Inactivo", "Egresado", "Baja"}:
            alumno.estado_alumno = "Activo"

        return False

    documentos = {
        documento.id_tipo_documento: documento
        for documento in (
            db.query(DocumentoModel)
            .filter(
                DocumentoModel.id_expediente == expediente.id_expediente
            )
            .all()
        )
    }

    documentos_requeridos = [
        documentos.get(tipo.id_tipo_documento)
        for tipo in tipos_habilitantes
    ]

    existe_rechazado = any(
        documento is not None
        and documento.estado_documento == "Rechazado"
        for documento in documentos_requeridos
    )

    todos_aprobados = all(
        documento is not None
        and documento.estado_documento == "Aprobado"
        for documento in documentos_requeridos
    )

    if existe_rechazado:
        expediente.estado_expediente = "Rechazado"

        if alumno.estado_alumno not in {"Activo", "Inactivo", "Egresado", "Baja"}:
            alumno.estado_alumno = "Activo"

    elif todos_aprobados:
        expediente.estado_expediente = "Aprobado"

        if alumno.estado_alumno not in {"Activo", "Inactivo", "Egresado", "Baja"}:
            alumno.estado_alumno = "Activo"

    else:
        expediente.estado_expediente = "En Revision"

        if alumno.estado_alumno not in {"Activo", "Inactivo", "Egresado", "Baja"}:
            alumno.estado_alumno = "Activo"

    se_habilito = (not era_elegible and expediente.estado_expediente == "Aprobado")

    return se_habilito
####################################################################################
def listar_revision_documental(db: Session = Depends(obtener_db)):
    documentos = (
        db.query(DocumentoModel)
        .join(ExpedienteModel, ExpedienteModel.id_expediente == DocumentoModel.id_expediente)
        .join(AlumnoModel, AlumnoModel.id_alumno == ExpedienteModel.id_alumno)
        .join(UsuarioModel, UsuarioModel.id_usuario == AlumnoModel.id_usuario)
        .join(TipoDocumentoModel, TipoDocumentoModel.id_tipo_documento == DocumentoModel.id_tipo_documento)
        .filter(DocumentoModel.nombre_archivo != "")
        .order_by(DocumentoModel.fecha_carga.desc())
        .all()
    )
    tipos = db.query(TipoDocumentoModel).order_by(TipoDocumentoModel.etapa.asc()).all()
    alumnos = (
        db.query(AlumnoModel)
        .join(UsuarioModel, UsuarioModel.id_usuario == AlumnoModel.id_usuario)
        .order_by(AlumnoModel.apellido_paterno.asc(), AlumnoModel.nombre.asc())
        .all()
    )
    return RevisionDocumentalResponse(
        alumnos=[_alumno_revision_response(alumno, tipos) for alumno in alumnos],
        documentos=[_documento_response(db, documento) for documento in documentos],
        formatos=_listar_formatos(db),
        tipos_documento=tipos,
    )


@router.get(
    "/formatos",
    response_model=list[FormatoDocumentoResponse],
    dependencies=[Depends(requerir_roles(["Alumno", "Coordinador de Practicas", "Administrador"]))],
)
def listar_formatos_documento(db: Session = Depends(obtener_db)):
    return _listar_formatos(db)


@router.get(
    "/formatos/{id_formato}/archivo",
    dependencies=[Depends(requerir_roles(["Alumno", "Coordinador de Practicas", "Administrador", "Direccion"]))],
)
def descargar_formato_documento_seguro(id_formato: int, db: Session = Depends(obtener_db)):
    formato = db.query(FormatoDocumentoModel).filter(FormatoDocumentoModel.id_formato == id_formato).first()
    if formato is None or not formato.ruta_archivo:
        raise HTTPException(status_code=404, detail="Formato no encontrado")
    return _file_response_segura(formato.ruta_archivo, formato.nombre_archivo, formato.mime_type)


@router.post(
    "/formatos",
    response_model=FormatoDocumentoResponse,
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)
def subir_formato_documento(datos: SubirFormatoRequest, db: Session = Depends(obtener_db)):
    tipo = db.query(TipoDocumentoModel).filter(
        TipoDocumentoModel.id_tipo_documento == datos.id_tipo_documento
    ).first()
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de documento no encontrado")
    if not tipo.requiere_formato:
        tipo.requiere_formato = True

    contenido = _decode_base64(datos.contenido_base64)
    validar_formato_institucional(contenido, datos.nombre_archivo, datos.mime_type)

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = _safe_filename(datos.nombre_archivo)
    stored_name = f"{uuid4().hex}_{safe_name}"
    ruta = UPLOAD_DIR / stored_name
    ruta.write_bytes(contenido)

    db.query(FormatoDocumentoModel).filter(
        FormatoDocumentoModel.id_tipo_documento == datos.id_tipo_documento,
        FormatoDocumentoModel.activo.is_(True),  # noqa: E712
    ).update({"activo": False})

    formato = FormatoDocumentoModel(
        id_tipo_documento=datos.id_tipo_documento,
        nombre_archivo=safe_name,
        ruta_archivo=str(ruta),
        mime_type=datos.mime_type,
        descripcion=datos.descripcion,
        activo=True,
    )
    db.add(formato)
    notificar_roles(
        db,
        ["Alumno"],
        "Formato actualizado",
        f"Coordinacion actualizo el formato de {tipo.nombre_documento}. Revisalo antes de subir documentos.",
    )
    db.commit()
    db.refresh(formato)
    return _formato_response(formato)


@router.patch(
    "/{id_documento}/estado",
    response_model=DocumentoRevisionResponse,
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)
def cambiar_estado_documento(
    id_documento: int,
    datos: CambiarEstadoDocumentoRequest,
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
    db: Session = Depends(obtener_db),
):
    estados_validos = {"Pendiente", "Aprobado", "Observado", "Rechazado"}
    if datos.estado not in estados_validos:
        raise HTTPException(status_code=400, detail="Estado de documento invalido")

    documento = db.query(DocumentoModel).filter(
        DocumentoModel.id_documento == id_documento
    ).first()
    if documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    validar_etapa_actual(documento.expediente.convocatoria, "validacion")

    estado_anterior = documento.estado_documento
    ahora = datetime.now()
    if datos.estado == "Pendiente" and estado_anterior != "Pendiente":
        if documento.fecha_revision is None:
            raise HTTPException(status_code=400, detail="No hay revision reciente para deshacer")
        if ahora - documento.fecha_revision > timedelta(minutes=10):
            raise HTTPException(status_code=400, detail="Solo se puede deshacer la revision durante los primeros 10 minutos")
        seleccion_posterior = (
            db.query(SeleccionEmpresaModel)
            .filter(
                SeleccionEmpresaModel.id_alumno == documento.expediente.id_alumno,
                SeleccionEmpresaModel.fecha_seleccion > documento.fecha_revision,
                SeleccionEmpresaModel.estado == "Registrada",
            )
            .first()
        )
        if seleccion_posterior is not None:
            raise HTTPException(status_code=400, detail="No se puede deshacer porque el alumno ya avanzo a seleccion de empresa")

    documento.estado_documento = datos.estado
    documento.fecha_revision = None if datos.estado == "Pendiente" else ahora
    documento.revisado_por = None if datos.estado == "Pendiente" else usuario_actual.id_usuario
    if datos.comentario:
        db.add(
            ObservacionModel(
                id_documento=documento.id_documento,
                id_usuario=usuario_actual.id_usuario,
                descripcion=datos.comentario,
                tipo_observacion=_tipo_observacion_revision(datos.estado),
            )
        )
#####################################3333
    alumno = documento.expediente.alumno

    seleccion_habilitada = _actualizar_estado_expediente(
        db,
        documento.expediente,
    )

    crear_notificacion(
        db,
        alumno.id_usuario if alumno else None,
        f"Documento {datos.estado.lower()}",
        (
            f"Tu documento "
            f"{documento.tipo_documento.nombre_documento} "
            f"fue marcado como {datos.estado}."
            + (
                f" Comentario: {datos.comentario}"
                if datos.comentario
                else ""
            )
        ),
    )

    if seleccion_habilitada:
        crear_notificacion(
            db,
            alumno.id_usuario,
            "Selección de empresa habilitada",
            (
                "Todos tus documentos iniciales fueron aprobados. "
                "Ya puedes seleccionar empresas desde el padrón."
            ),
        )

    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Deshacer revision documental" if datos.estado == "Pendiente" and estado_anterior != "Pendiente" else "Revisar documento de alumno",
        "documentos",
        f"Documento {documento.id_documento} cambio de {estado_anterior} a {datos.estado}.",
        "documento_alumno",
        documento.id_documento,
    )

    db.commit()
    db.refresh(documento)

    return _documento_response(db, documento)

@router.get(
    "/flujo/alumnos",
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)
def listar_alumnos_revision_flujo(db: Session = Depends(obtener_db)):
    try:
        return listar_alumnos_revision(db)
    except HTTPException as exc:
        detalles_vacios = {
            "No hay convocatoria registrada",
            "No hay convocatoria activa",
            "No hay alumnos registrados",
            "No hay expedientes registrados",
        }
        if exc.status_code == 400 and exc.detail in detalles_vacios:
            return []
        raise


@router.get(
    "/flujo/alumnos/{id_alumno}",
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)
def obtener_documentacion_alumno_flujo(id_alumno: int, db: Session = Depends(obtener_db)):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    return serializar_documentacion(db, alumno)

"""
@router.post(
    "/flujo/alumnos/{id_alumno}/habilitar-seleccion",
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)
def habilitar_seleccion_empresa_flujo(id_alumno: int, db: Session = Depends(obtener_db)):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    detalle = serializar_documentacion(db, alumno)
    if not detalle["expediente"]["expediente_inicial_aprobado"]:
        raise HTTPException(status_code=400, detail="Primero deben aprobarse los 7 documentos iniciales")
    alumno.estado_alumno = "Activo"
    db.commit()
    return serializar_documentacion(db, alumno)

"""

@router.post(
    "/flujo/alumnos/{id_alumno}/habilitar-asignacion",
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)
def habilitar_documentacion_asignacion_flujo(id_alumno: int, db: Session = Depends(obtener_db)):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    return habilitar_documentacion_asignacion(db, alumno)


@router.get(
    "/flujo/{id_documento}/archivo",
    dependencies=[Depends(requerir_roles(["Coordinador de Practicas", "Administrador"]))],
)
def descargar_documento_revision_flujo(id_documento: int, db: Session = Depends(obtener_db)):
    documento = db.query(DocumentoModel).filter(DocumentoModel.id_documento == id_documento).first()
    if documento is None or not documento.ruta_archivo:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return _file_response_segura(documento.ruta_archivo, documento.nombre_archivo or "documento.pdf")
