from __future__ import annotations

import base64
import logging
import mimetypes
import re
import unicodedata
from datetime import date, datetime, timedelta
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.services.auditoria_service import registrar_bitacora
from app.services.convenio_empresa_service import activar_convenio_actual, obtener_convenio_actual
from app.services.empresa_reglas_service import obtener_convenio_vigente_actual, obtener_vinculacion_aprobada_actual
from app.services.notificacion_service import crear_notificacion, notificar_roles
from app.services.upload_security import (
    normalizar_nombre_archivo,
    resolver_archivo_en_uploads,
    validar_documento_usuario,
    validar_formato_institucional,
)
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import obtener_id_empresa_actual, obtener_usuario_actual, requerir_empresa_actual_o_roles, requerir_roles
from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.documento_empresa import DocumentoEmpresaModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.formato_empresa import FormatoEmpresaModel
from infrastructure.persistence.models.participacion_empresa_convocatoria import ParticipacionEmpresaConvocatoriaModel
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel
from infrastructure.persistence.models.tipo_documento_empresa import TipoDocumentoEmpresaModel
from infrastructure.persistence.models.usuario import UsuarioModel
from infrastructure.persistence.models.vacante import VacanteModel


logger = logging.getLogger(__name__)

router = APIRouter(tags=["Documentacion de Empresas"])
UPLOADS_DIR = Path(__file__).resolve().parents[3] / "uploads"
UPLOAD_EMPRESAS_DIR = Path(__file__).resolve().parents[3] / "uploads" / "empresas"
UPLOAD_DOCUMENTOS_DIR = UPLOAD_EMPRESAS_DIR
UPLOAD_FORMATOS_DIR = UPLOAD_EMPRESAS_DIR / "formatos"
class SubirDocumentoEmpresaRequest(BaseModel):
    id_tipo_documento_empresa: int
    nombre_archivo: str
    contenido_base64: str
    mime_type: str | None = None


class SubirFormatoEmpresaRequest(BaseModel):
    id_tipo_documento_empresa: int
    id_empresa: int | None = None
    nombre_archivo: str
    contenido_base64: str
    mime_type: str | None = None
    version: str | None = None


class RevisarDocumentoEmpresaRequest(BaseModel):
    estado_documento: str
    observaciones: str | None = None
    fecha_inicio_convenio: date | None = None
    fecha_fin_convenio: date | None = None


class EditarDocumentoEmpresaRequest(BaseModel):
    nombre_archivo: str
    contenido_base64: str
    mime_type: str | None = None
    observaciones: str | None = None


class ConfigurarRequisitoEmpresaRequest(BaseModel):
    nombre: str
    descripcion: str | None = None
    obligatorio: bool = True
    requiere_formato: bool = False
    activo: bool = True
    etapa: str = "Documentacion"
    tipo_tramite: str | None = None


TIPOS_BASE_EMPRESA = [
    ("Formato de registro de unidad receptora", "Datos generales y representante de la empresa.", True, "Documentacion"),
    ("Constancia de situacion fiscal", "Documento fiscal actualizado de la empresa.", False, "Documentacion"),
    ("Comprobante de domicilio", "Comprobante reciente de la direccion registrada.", False, "Documentacion"),
    ("Identificacion del representante legal", "Identificacion oficial del responsable o representante.", False, "Documentacion"),
    ("Convenio o carta compromiso", "Documento institucional para formalizar la colaboracion.", True, "Convenio"),
]


def _safe_filename(filename: str) -> str:
    return normalizar_nombre_archivo(filename, "documento.pdf")


def _slug_carpeta(valor: str | None, fallback: str) -> str:
    texto = valor or fallback
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    texto = re.sub(r"[^A-Za-z0-9]+", "_", texto).strip("_").lower()
    return texto or fallback


def _convocatoria_carpeta_empresa(db: Session, id_empresa: int) -> str:
    participacion = (
        db.query(ParticipacionEmpresaConvocatoriaModel)
        .join(ConvocatoriaModel, ConvocatoriaModel.id_convocatoria == ParticipacionEmpresaConvocatoriaModel.id_convocatoria)
        .filter(ParticipacionEmpresaConvocatoriaModel.id_empresa == id_empresa)
        .order_by(
            ConvocatoriaModel.fecha_inicio_general.desc().nullslast(),
            ParticipacionEmpresaConvocatoriaModel.fecha_solicitud.desc(),
        )
        .first()
    )
    if participacion is None:
        return "sin_convocatoria"
    return f"convocatoria_{participacion.id_convocatoria}"


def _carpeta_documento_empresa(db: Session, empresa: EmpresaModel, tipo: TipoDocumentoEmpresaModel) -> Path:
    empresa_slug = _slug_carpeta(
        "_".join(parte for parte in [empresa.nombre_empresa, empresa.rfc] if parte),
        f"empresa_{empresa.id_empresa}",
    )
    return (
        UPLOAD_DOCUMENTOS_DIR
        / empresa_slug
        / _convocatoria_carpeta_empresa(db, empresa.id_empresa)
        / "documentacion"
        / _slug_carpeta(tipo.etapa, "documentacion")
    )


def _carpeta_formato_empresa(tipo: TipoDocumentoEmpresaModel) -> Path:
    return UPLOAD_FORMATOS_DIR / _slug_carpeta(tipo.etapa, "documentacion") / f"requisito_{tipo.id_tipo_documento_empresa}"


def _decode_base64(content: str) -> bytes:
    payload = content.split(",", 1)[1] if "," in content else content
    try:
        return base64.b64decode(payload, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Archivo base64 invalido") from exc


def _validar_etapa(etapa: str) -> str:
    if etapa not in {"Documentacion", "Convenio", "Vinculacion"}:
        raise HTTPException(status_code=400, detail="La etapa debe ser Documentacion, Convenio o Vinculacion")
    return etapa


def _validar_tipo_tramite_requisito(tipo_tramite: str | None) -> str | None:
    if tipo_tramite in (None, "", "Todos", "Todas"):
        return None
    if tipo_tramite not in {"Convenio", "Vinculacion"}:
        raise HTTPException(status_code=400, detail="El tipo de tramite debe ser Convenio o Vinculacion")
    return tipo_tramite


def _asegurar_tipos_base(db: Session) -> None:
    if db.query(TipoDocumentoEmpresaModel).count() > 0:
        actualizados = False
        for tipo in db.query(TipoDocumentoEmpresaModel).all():
            texto = f"{tipo.nombre} {tipo.descripcion or ''}".lower()
            if tipo.etapa == "Documentacion" and ("convenio" in texto or "carta compromiso" in texto):
                tipo.etapa = "Convenio"
                actualizados = True
        if actualizados:
            db.commit()
        return

    for nombre, descripcion, requiere_formato, etapa in TIPOS_BASE_EMPRESA:
        db.add(
            TipoDocumentoEmpresaModel(
                nombre=nombre,
                descripcion=descripcion,
                obligatorio=True,
                requiere_formato=requiere_formato,
                activo=True,
                etapa=etapa,
            )
        )
    db.commit()


def _formato_response(formato: FormatoEmpresaModel | None):
    if formato is None:
        return None
    return {
        "id_formato_empresa": formato.id_formato_empresa,
        "id_empresa": formato.id_empresa,
        "alcance": "Empresa" if formato.id_empresa else "Todas",
        "empresa_nombre": formato.empresa.nombre_empresa if formato.empresa else None,
        "nombre_archivo": formato.nombre_archivo,
        "url": f"/empresa/documentos/formatos/{formato.id_formato_empresa}/archivo",
        "version": formato.version,
        "formato_activo": formato.activo,
        "fecha_subida": formato.fecha_subida.isoformat() if formato.fecha_subida else None,
    }


def _documento_response(documento: DocumentoEmpresaModel | None):
    if documento is None:
        return None
    return {
        "id_documento_empresa": documento.id_documento_empresa,
        "id_empresa": documento.id_empresa,
        "id_tipo_documento_empresa": documento.id_tipo_documento_empresa,
        "nombre_archivo": documento.nombre_archivo,
        "url": f"/empresa/documentos/documentos/{documento.id_documento_empresa}/archivo" if documento.ruta_archivo else None,
        "estado_documento": documento.estado_documento,
        "observaciones": documento.observaciones,
        "fecha_subida": documento.fecha_subida.isoformat() if documento.fecha_subida else None,
        "fecha_revision": documento.fecha_revision.isoformat() if documento.fecha_revision else None,
    }


def _nombre_rol(usuario: UsuarioModel) -> str | None:
    return usuario.rol.nombre if usuario.rol is not None else None


def _asegurar_permiso_documento_empresa(usuario: UsuarioModel, documento: DocumentoEmpresaModel) -> None:
    rol = _nombre_rol(usuario)
    if rol in {"Administrador", "Coordinador de Unidades Receptoras", "Direccion"}:
        return
    if (
        rol == "Unidad Receptora"
        and usuario.responsable_empresa is not None
        and usuario.responsable_empresa.id_empresa == documento.id_empresa
    ):
        return
    raise HTTPException(status_code=403, detail="No tienes permisos para ver este documento")


def _etapa_permitida_para_empresa(etapa: str, empresa: EmpresaModel) -> bool:
    if etapa == "Documentacion":
        return True
    if etapa == "Convenio":
        return empresa.tipo_tramite == "Convenio"
    if etapa == "Vinculacion":
        return empresa.tipo_tramite == "Vinculacion"
    return False


def _requisito_permitido_para_empresa(tipo: TipoDocumentoEmpresaModel, empresa: EmpresaModel) -> bool:
    if tipo.tipo_tramite is not None and tipo.tipo_tramite != empresa.tipo_tramite:
        return False
    return _etapa_permitida_para_empresa(tipo.etapa, empresa)


def _asegurar_permiso_formato_empresa(usuario: UsuarioModel, formato: FormatoEmpresaModel) -> None:
    rol = _nombre_rol(usuario)
    if rol in {"Administrador", "Coordinador de Unidades Receptoras", "Direccion"}:
        return
    if rol == "Unidad Receptora" and usuario.responsable_empresa is not None:
        empresa = usuario.responsable_empresa.empresa
        if empresa is None:
            raise HTTPException(status_code=403, detail="No tienes permisos para ver este formato")
        if formato.id_empresa is not None and formato.id_empresa != empresa.id_empresa:
            raise HTTPException(status_code=404, detail="Formato no encontrado")
        if not _requisito_permitido_para_empresa(formato.tipo_documento, empresa):
            raise HTTPException(status_code=404, detail="Formato no encontrado")
        return
    raise HTTPException(status_code=403, detail="No tienes permisos para ver este formato")


def _file_response_segura(ruta_archivo: str | None, nombre_archivo: str | None):
    ruta = resolver_archivo_en_uploads(ruta_archivo, UPLOADS_DIR)
    media_type = mimetypes.guess_type(nombre_archivo or ruta.name)[0] or "application/octet-stream"
    return FileResponse(ruta, media_type=media_type, filename=nombre_archivo or ruta.name)


def _puede_eliminar_requisito(db: Session, id_tipo_documento_empresa: int) -> bool:
    # Los formatos pertenecen al requisito y se eliminan junto con el. Los
    # documentos cargados por empresas si forman parte del historial y evitan
    # el borrado fisico; en ese caso el requisito solamente puede desactivarse.
    return (
        db.query(DocumentoEmpresaModel)
        .filter(DocumentoEmpresaModel.id_tipo_documento_empresa == id_tipo_documento_empresa)
        .first()
        is None
    )


def _requisito_response(tipo: TipoDocumentoEmpresaModel, db: Session | None = None):
    formatos_activos = [formato for formato in tipo.formatos if formato.activo and formato.id_empresa is None]
    formato = sorted(
        formatos_activos,
        key=lambda item: item.updated_at or item.created_at,
        reverse=True,
    )[0] if formatos_activos else None
    return {
        "id_tipo_documento_empresa": tipo.id_tipo_documento_empresa,
        "nombre": tipo.nombre,
        "descripcion": tipo.descripcion,
        "obligatorio": tipo.obligatorio,
        "activo": tipo.activo,
        "requiere_formato": tipo.requiere_formato,
        "etapa": tipo.etapa,
        "tipo_tramite": tipo.tipo_tramite,
        "formato": _formato_response(formato),
        "puede_eliminar": (
            _puede_eliminar_requisito(db, tipo.id_tipo_documento_empresa)
            if db is not None
            else False
        ),
    }


def _formato_para_empresa(tipo: TipoDocumentoEmpresaModel, empresa: EmpresaModel):
    formatos_activos = [formato for formato in tipo.formatos if formato.activo]
    formatos_empresa = [formato for formato in formatos_activos if formato.id_empresa == empresa.id_empresa]
    formatos_generales = [formato for formato in formatos_activos if formato.id_empresa is None]
    candidatos = formatos_empresa or formatos_generales
    return sorted(
        candidatos,
        key=lambda item: item.updated_at or item.created_at,
        reverse=True,
    )[0] if candidatos else None


def _es_requisito_de_convenio(tipo: TipoDocumentoEmpresaModel | None) -> bool:
    if tipo is None:
        return False
    if tipo.etapa == "Convenio":
        return True
    texto = f"{tipo.nombre} {tipo.descripcion or ''}".lower()
    return "convenio" in texto or "carta compromiso" in texto


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
        .all()
    )
    por_tipo = {documento.id_tipo_documento_empresa: documento for documento in documentos}
    return all(
        por_tipo.get(tipo.id_tipo_documento_empresa) is not None
        and por_tipo[tipo.id_tipo_documento_empresa].estado_documento == "Aprobado"
        for tipo in tipos_obligatorios
    )


def _sincronizar_convenio_desde_documento(
    db: Session,
    documento: DocumentoEmpresaModel,
    empresa: EmpresaModel | None,
    tipo: TipoDocumentoEmpresaModel | None = None,
    fecha_inicio: date | None = None,
    fecha_fin: date | None = None,
) -> None:
    tipo_documento = tipo or documento.tipo_documento
    if empresa is None or not _es_requisito_de_convenio(tipo_documento):
        return

    convenio_actual = obtener_convenio_actual(db, empresa.id_empresa)

    if documento.estado_documento == "Aprobado":
        inicio = fecha_inicio or date.today()
        fin = fecha_fin or (inicio + timedelta(days=365))
        if fin < inicio:
            raise HTTPException(
                status_code=400,
                detail="La fecha fin del convenio no puede ser menor a la fecha inicio",
            )

        convenio_objetivo = convenio_actual
        if convenio_objetivo is None or convenio_objetivo.estado_convenio == "Vencido":
            convenio_objetivo = ConvenioModel(
                id_empresa=empresa.id_empresa,
                fecha_inicio=inicio,
                fecha_fin=fin,
                es_actual=False,
                estado_convenio="Pendiente",
                observaciones=documento.observaciones,
            )
            db.add(convenio_objetivo)
            db.flush()

        activar_convenio_actual(
            db,
            empresa,
            convenio_objetivo,
            fecha_inicio=inicio,
            fecha_fin=fin,
        )
        return

    if documento.estado_documento == "Pendiente":
        pendiente = convenio_actual if convenio_actual and convenio_actual.estado_convenio == "Pendiente" else None
        if pendiente is None:
            db.add(
                ConvenioModel(
                    id_empresa=empresa.id_empresa,
                    fecha_inicio=None,
                    fecha_fin=None,
                    es_actual=False,
                    estado_convenio="Pendiente",
                    observaciones=documento.observaciones,
                )
            )
        else:
            pendiente.observaciones = documento.observaciones
        return

    if convenio_actual is not None and documento.estado_documento == "Rechazado":
        convenio_actual.estado_convenio = "Rechazado"
        convenio_actual.observaciones = documento.observaciones

def _recalcular_estado_empresa(db: Session, empresa: EmpresaModel) -> None:
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
    documentos = (
        db.query(DocumentoEmpresaModel)
        .filter(DocumentoEmpresaModel.id_empresa == empresa.id_empresa)
        .all()
    )
    por_tipo = {documento.id_tipo_documento_empresa: documento for documento in documentos}

    if not tipos_obligatorios:
        return

    if any(
        por_tipo.get(tipo.id_tipo_documento_empresa) is None
        for tipo in tipos_obligatorios
    ):
        empresa.estado_empresa = "Pendiente"
        return

    if any(
        por_tipo[tipo.id_tipo_documento_empresa].estado_documento == "Rechazado"
        for tipo in tipos_obligatorios
    ):
        empresa.estado_empresa = "Suspendida"
        return

    if all(
        por_tipo[tipo.id_tipo_documento_empresa].estado_documento == "Aprobado"
        for tipo in tipos_obligatorios
    ):
        convenio_actual = obtener_convenio_actual(db, empresa.id_empresa)
        hoy = date.today()
        if (
            convenio_actual is not None
            and convenio_actual.estado_convenio == "Vigente"
            and convenio_actual.fecha_inicio <= hoy <= convenio_actual.fecha_fin
        ):
            empresa.estado_empresa = "Activa"
        else:
            empresa.estado_empresa = "Pendiente"
        return

    empresa.estado_empresa = "Pendiente"


def _empresa_documentacion_response(db: Session, empresa: EmpresaModel):
    _asegurar_tipos_base(db)
    tipos = (
        db.query(TipoDocumentoEmpresaModel)
        .options(joinedload(TipoDocumentoEmpresaModel.formatos))
        .filter(TipoDocumentoEmpresaModel.activo.is_(True))
        .order_by(TipoDocumentoEmpresaModel.id_tipo_documento_empresa.asc())
        .all()
    )
    documentos = (
        db.query(DocumentoEmpresaModel)
        .filter(DocumentoEmpresaModel.id_empresa == empresa.id_empresa)
        .all()
    )
    por_tipo = {documento.id_tipo_documento_empresa: documento for documento in documentos}
    documentacion_legal_aprobada = _documentacion_legal_aprobada(db, empresa.id_empresa)

    items = []
    for tipo in tipos:
        if not _requisito_permitido_para_empresa(tipo, empresa):
            continue
        if tipo.etapa in {"Convenio", "Vinculacion"} and not documentacion_legal_aprobada:
            continue
        formato = _formato_para_empresa(tipo, empresa)
        documento = por_tipo.get(tipo.id_tipo_documento_empresa)
        items.append(
            {
                "id_tipo_documento_empresa": tipo.id_tipo_documento_empresa,
                "nombre": tipo.nombre,
                "descripcion": tipo.descripcion,
                "obligatorio": tipo.obligatorio,
                "activo": tipo.activo,
                "requiere_formato": tipo.requiere_formato,
                "etapa": tipo.etapa,
                "formato": _formato_response(formato),
                "documento": _documento_response(documento),
            }
        )

    resumen = {
        "total": len(items),
        "aprobados": sum(1 for item in items if item["documento"] and item["documento"]["estado_documento"] == "Aprobado"),
        "pendientes": sum(1 for item in items if item["documento"] and item["documento"]["estado_documento"] == "Pendiente"),
        "rechazados": sum(1 for item in items if item["documento"] and item["documento"]["estado_documento"] == "Rechazado"),
        "faltantes": sum(1 for item in items if item["documento"] is None and item["obligatorio"]),
    }
    convenio_actual = obtener_convenio_actual(db, empresa.id_empresa)

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
            "tipo_tramite": empresa.tipo_tramite,
        },
        "resumen": resumen,
        "convenio_actual": (
            {
                "id_convenio": convenio_actual.id_convenio,
                "fecha_inicio": convenio_actual.fecha_inicio.isoformat() if convenio_actual.fecha_inicio else None,
                "fecha_fin": convenio_actual.fecha_fin.isoformat() if convenio_actual.fecha_fin else None,
                "estado_convenio": convenio_actual.estado_convenio,
                "es_actual": convenio_actual.es_actual,
                "observaciones": convenio_actual.observaciones,
            }
            if convenio_actual
            else None
        ),
        "documentos": items,
    }


@router.get(
    "/empresa/documentos/me",
    dependencies=[Depends(requerir_roles(["Unidad Receptora", "Administrador"]))],
)
def listar_mis_documentos_empresa(
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return listar_documentos_empresa(id_empresa, db)


@router.post(
    "/empresa/documentos/me/subir",
    dependencies=[Depends(requerir_roles(["Unidad Receptora", "Administrador"]))],
)
def subir_mi_documento_empresa(
    datos: SubirDocumentoEmpresaRequest,
    id_empresa: int = Depends(obtener_id_empresa_actual),
    db: Session = Depends(obtener_db),
):
    return subir_documento_empresa(id_empresa, datos, db)


@router.get(
    "/empresa/documentos/{id_empresa}",
    dependencies=[Depends(requerir_empresa_actual_o_roles(["Administrador"]))],
)
def listar_documentos_empresa(id_empresa: int, db: Session = Depends(obtener_db)):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")
    return _empresa_documentacion_response(db, empresa)


@router.post(
    "/empresa/documentos/{id_empresa}/subir",
    dependencies=[Depends(requerir_empresa_actual_o_roles(["Administrador"]))],
)
def subir_documento_empresa(
    id_empresa: int,
    datos: SubirDocumentoEmpresaRequest,
    db: Session = Depends(obtener_db),
):
    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == id_empresa).first()
    if empresa is None:
        raise HTTPException(status_code=404, detail="Empresa no encontrada")

    tipo = (
        db.query(TipoDocumentoEmpresaModel)
        .filter(TipoDocumentoEmpresaModel.id_tipo_documento_empresa == datos.id_tipo_documento_empresa)
        .first()
    )
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de documento no encontrado")
    if not _requisito_permitido_para_empresa(tipo, empresa):
        raise HTTPException(status_code=400, detail="El requisito no corresponde al tipo de tramite de la empresa")
    if tipo.etapa in {"Convenio", "Vinculacion"} and not _documentacion_legal_aprobada(db, id_empresa):
        raise HTTPException(
            status_code=400,
            detail="El tramite se habilita cuando la documentacion legal obligatoria esta aprobada",
        )
    contenido = _decode_base64(datos.contenido_base64)
    validar_documento_usuario(contenido, datos.nombre_archivo, datos.mime_type)

    safe_name = _safe_filename(datos.nombre_archivo)
    carpeta = _carpeta_documento_empresa(db, empresa, tipo)
    carpeta.mkdir(parents=True, exist_ok=True)
    ruta = carpeta / f"{datos.id_tipo_documento_empresa}_{uuid4().hex}_{safe_name}"
    ruta.write_bytes(contenido)

    documento = (
        db.query(DocumentoEmpresaModel)
        .filter(
            DocumentoEmpresaModel.id_empresa == id_empresa,
            DocumentoEmpresaModel.id_tipo_documento_empresa == datos.id_tipo_documento_empresa,
        )
        .first()
    )
    if documento is None:
        documento = DocumentoEmpresaModel(
            id_empresa=id_empresa,
            id_tipo_documento_empresa=datos.id_tipo_documento_empresa,
            nombre_archivo=safe_name,
            ruta_archivo=str(ruta),
            estado_documento="Pendiente",
        )
        db.add(documento)
    else:
        documento.nombre_archivo = safe_name
        documento.ruta_archivo = str(ruta)
        documento.estado_documento = "Pendiente"
        documento.observaciones = None
        documento.fecha_revision = None

    db.flush()
    _sincronizar_convenio_desde_documento(db, documento, empresa, tipo)
    _recalcular_estado_empresa(db, empresa)
    notificar_roles(
        db,
        ["Coordinador de Unidades Receptoras", "Administrador"],
        "Documento de empresa recibido",
        f"{empresa.nombre_empresa} subio {tipo.nombre} para revision.",
    )
    db.commit()
    db.refresh(documento)
    return _documento_response(documento)


@router.get("/empresa/documentos/documentos/{id_documento_empresa}/archivo")
def descargar_documento_empresa_seguro(
    id_documento_empresa: int,
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
    db: Session = Depends(obtener_db),
):
    documento = (
        db.query(DocumentoEmpresaModel)
        .filter(DocumentoEmpresaModel.id_documento_empresa == id_documento_empresa)
        .first()
    )
    if documento is None or not documento.ruta_archivo:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    _asegurar_permiso_documento_empresa(usuario_actual, documento)
    return _file_response_segura(documento.ruta_archivo, documento.nombre_archivo)


@router.get("/empresa/documentos/formatos/{id_formato_empresa}/archivo")
def descargar_formato_empresa_seguro(
    id_formato_empresa: int,
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
    db: Session = Depends(obtener_db),
):
    formato = (
        db.query(FormatoEmpresaModel)
        .filter(FormatoEmpresaModel.id_formato_empresa == id_formato_empresa)
        .first()
    )
    if formato is None or not formato.ruta_archivo:
        raise HTTPException(status_code=404, detail="Formato no encontrado")
    _asegurar_permiso_formato_empresa(usuario_actual, formato)
    return _file_response_segura(formato.ruta_archivo, formato.nombre_archivo)


@router.get(
    "/coord-unidades/documentos-empresa",
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)
def listar_documentacion_empresas(db: Session = Depends(obtener_db)):
    empresas = db.query(EmpresaModel).order_by(EmpresaModel.id_empresa.desc()).all()
    return [_empresa_documentacion_response(db, empresa) for empresa in empresas]


@router.post(
    "/coord-unidades/documentos-empresa/formatos",
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)
def subir_formato_empresa(datos: SubirFormatoEmpresaRequest, db: Session = Depends(obtener_db)):
    return _guardar_formato_empresa(datos, db)


@router.delete(
    "/coord-unidades/documentos-empresa/formatos/{id_formato_empresa}",
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)
def eliminar_formato_empresa(id_formato_empresa: int, db: Session = Depends(obtener_db)):
    formato = (
        db.query(FormatoEmpresaModel)
        .filter(FormatoEmpresaModel.id_formato_empresa == id_formato_empresa)
        .first()
    )
    if formato is None:
        raise HTTPException(status_code=404, detail="Formato no encontrado")

    ruta = Path(formato.ruta_archivo) if formato.ruta_archivo else None
    db.delete(formato)
    db.commit()

    if ruta is not None:
        try:
            if ruta.exists() and ruta.is_file():
                ruta.unlink()
        except OSError as error:
            logger.warning("No se pudo eliminar el archivo fisico del formato %s: %s", ruta, error)

    return {"mensaje": "Formato eliminado correctamente"}


def _guardar_formato_empresa(datos: SubirFormatoEmpresaRequest, db: Session):
    tipo = (
        db.query(TipoDocumentoEmpresaModel)
        .filter(TipoDocumentoEmpresaModel.id_tipo_documento_empresa == datos.id_tipo_documento_empresa)
        .first()
    )
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de documento no encontrado")
    if not tipo.requiere_formato:
        raise HTTPException(status_code=400, detail="El requisito no esta configurado para usar formato")
    if tipo.etapa in {"Convenio", "Vinculacion"} and datos.id_empresa is None:
        raise HTTPException(
            status_code=400,
            detail="Los formatos de Convenio y Vinculación deben asignarse a una empresa específica.",
        )
    empresa = None
    if datos.id_empresa is not None:
        empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == datos.id_empresa).first()
        if empresa is None:
            raise HTTPException(status_code=404, detail="Empresa no encontrada")
        if not _requisito_permitido_para_empresa(tipo, empresa):
            raise HTTPException(
                status_code=400,
                detail="El formato no corresponde al tipo de tramite de la empresa seleccionada",
            )

    contenido = _decode_base64(datos.contenido_base64)
    validar_formato_institucional(contenido, datos.nombre_archivo, datos.mime_type)

    safe_name = _safe_filename(datos.nombre_archivo)
    carpeta = _carpeta_formato_empresa(tipo)
    carpeta.mkdir(parents=True, exist_ok=True)
    ruta = carpeta / f"formato_{tipo.id_tipo_documento_empresa}_{uuid4().hex}_{safe_name}"
    ruta.write_bytes(contenido)

    formatos_query = db.query(FormatoEmpresaModel).filter(
        FormatoEmpresaModel.id_tipo_documento_empresa == tipo.id_tipo_documento_empresa
    )
    if datos.id_empresa is None:
        formatos_query = formatos_query.filter(FormatoEmpresaModel.id_empresa.is_(None))
    else:
        formatos_query = formatos_query.filter(FormatoEmpresaModel.id_empresa == datos.id_empresa)
    formatos_query.update({"activo": False})

    formato = FormatoEmpresaModel(
        id_tipo_documento_empresa=tipo.id_tipo_documento_empresa,
        id_empresa=datos.id_empresa,
        nombre_archivo=safe_name,
        ruta_archivo=str(ruta),
        version=datos.version.strip() if datos.version else None,
        activo=True,
    )
    db.add(formato)
    notificar_roles(
        db,
        ["Unidad Receptora"],
        "Formato de empresa actualizado",
        f"Coordinacion actualizo el formato de {tipo.nombre}."
        + (f" Empresa: {empresa.nombre_empresa}." if empresa else ""),
    )
    db.commit()
    db.refresh(formato)
    return _formato_response(formato)


@router.get(
    "/coord-unidades/documentos-empresa/requisitos",
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)
def listar_requisitos_empresa(
    etapa: str | None = Query(default=None),
    db: Session = Depends(obtener_db),
):
    _asegurar_tipos_base(db)
    query = db.query(TipoDocumentoEmpresaModel).options(joinedload(TipoDocumentoEmpresaModel.formatos))
    if etapa is not None:
        query = query.filter(TipoDocumentoEmpresaModel.etapa == _validar_etapa(etapa))
    tipos = query.order_by(
        TipoDocumentoEmpresaModel.etapa.asc(),
        TipoDocumentoEmpresaModel.id_tipo_documento_empresa.asc(),
    ).all()
    return [_requisito_response(tipo, db) for tipo in tipos]


@router.post(
    "/coord-unidades/documentos-empresa/requisitos",
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)
def crear_requisito_empresa(
    datos: ConfigurarRequisitoEmpresaRequest,
    db: Session = Depends(obtener_db),
):
    nombre = datos.nombre.strip()
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre del documento es obligatorio")
    etapa = _validar_etapa(datos.etapa)
    tipo_tramite = _validar_tipo_tramite_requisito(datos.tipo_tramite)

    duplicado = (
        db.query(TipoDocumentoEmpresaModel)
        .filter(
            TipoDocumentoEmpresaModel.nombre == nombre,
            TipoDocumentoEmpresaModel.etapa == etapa,
            TipoDocumentoEmpresaModel.tipo_tramite == tipo_tramite,
            TipoDocumentoEmpresaModel.activo.is_(True),
        )
        .first()
    )
    if datos.activo and duplicado is not None:
        raise HTTPException(status_code=400, detail="Ya existe un requisito activo con ese nombre y etapa")

    tipo = TipoDocumentoEmpresaModel(
        nombre=nombre,
        descripcion=datos.descripcion.strip() if datos.descripcion else None,
        obligatorio=datos.obligatorio,
        requiere_formato=datos.requiere_formato,
        activo=datos.activo,
        etapa=etapa,
        tipo_tramite=tipo_tramite,
    )
    db.add(tipo)
    db.commit()
    db.refresh(tipo)
    return _requisito_response(tipo, db)


@router.post(
    "/coord-unidades/documentos-empresa/requisitos/{id_tipo_documento_empresa}/formato",
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)
def subir_formato_requisito_empresa(
    id_tipo_documento_empresa: int,
    datos: SubirFormatoEmpresaRequest,
    db: Session = Depends(obtener_db),
):
    datos.id_tipo_documento_empresa = id_tipo_documento_empresa
    return _guardar_formato_empresa(datos, db)


@router.put(
    "/coord-unidades/documentos-empresa/requisitos/{id_tipo_documento_empresa}",
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)
def configurar_requisito_empresa(
    id_tipo_documento_empresa: int,
    datos: ConfigurarRequisitoEmpresaRequest,
    db: Session = Depends(obtener_db),
):
    tipo = (
        db.query(TipoDocumentoEmpresaModel)
        .filter(TipoDocumentoEmpresaModel.id_tipo_documento_empresa == id_tipo_documento_empresa)
        .first()
    )
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de documento no encontrado")

    nombre = datos.nombre.strip()
    if not nombre:
        raise HTTPException(status_code=400, detail="El nombre del documento es obligatorio")
    etapa = _validar_etapa(datos.etapa)
    tipo_tramite = _validar_tipo_tramite_requisito(datos.tipo_tramite)

    duplicado = (
        db.query(TipoDocumentoEmpresaModel)
        .filter(
            TipoDocumentoEmpresaModel.nombre == nombre,
            TipoDocumentoEmpresaModel.etapa == etapa,
            TipoDocumentoEmpresaModel.tipo_tramite == tipo_tramite,
            TipoDocumentoEmpresaModel.activo.is_(True),
            TipoDocumentoEmpresaModel.id_tipo_documento_empresa != id_tipo_documento_empresa,
        )
        .first()
    )
    if datos.activo and duplicado is not None:
        raise HTTPException(status_code=400, detail="Ya existe otro requisito activo con ese nombre y etapa")

    tipo.nombre = nombre
    tipo.descripcion = datos.descripcion.strip() if datos.descripcion else None
    tipo.obligatorio = datos.obligatorio
    tipo.requiere_formato = datos.requiere_formato
    tipo.activo = datos.activo
    tipo.etapa = etapa
    tipo.tipo_tramite = tipo_tramite

    notificar_roles(
        db,
        ["Unidad Receptora"],
        "Requisito documental actualizado",
        f"Coordinacion actualizo el requisito {tipo.nombre}.",
    )
    db.commit()
    db.refresh(tipo)
    return _requisito_response(tipo, db)


@router.patch(
    "/coord-unidades/documentos-empresa/requisitos/{id_tipo_documento_empresa}/activar",
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)
def activar_requisito_empresa(
    id_tipo_documento_empresa: int,
    db: Session = Depends(obtener_db),
):
    tipo = (
        db.query(TipoDocumentoEmpresaModel)
        .options(joinedload(TipoDocumentoEmpresaModel.formatos))
        .filter(TipoDocumentoEmpresaModel.id_tipo_documento_empresa == id_tipo_documento_empresa)
        .first()
    )
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de documento no encontrado")

    tipo.activo = True
    db.commit()
    db.refresh(tipo)
    return _requisito_response(tipo, db)


@router.patch(
    "/coord-unidades/documentos-empresa/requisitos/{id_tipo_documento_empresa}/desactivar",
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)
def desactivar_requisito_empresa(
    id_tipo_documento_empresa: int,
    db: Session = Depends(obtener_db),
):
    tipo = (
        db.query(TipoDocumentoEmpresaModel)
        .options(joinedload(TipoDocumentoEmpresaModel.formatos))
        .filter(TipoDocumentoEmpresaModel.id_tipo_documento_empresa == id_tipo_documento_empresa)
        .first()
    )
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de documento no encontrado")

    tipo.activo = False
    db.commit()
    db.refresh(tipo)
    return _requisito_response(tipo, db)


@router.delete(
    "/coord-unidades/documentos-empresa/requisitos/{id_tipo_documento_empresa}",
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)
def eliminar_requisito_empresa(
    id_tipo_documento_empresa: int,
    db: Session = Depends(obtener_db),
):
    tipo = (
        db.query(TipoDocumentoEmpresaModel)
        .filter(TipoDocumentoEmpresaModel.id_tipo_documento_empresa == id_tipo_documento_empresa)
        .first()
    )
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de documento no encontrado")
    if not _puede_eliminar_requisito(db, id_tipo_documento_empresa):
        raise HTTPException(
            status_code=400,
            detail="No se puede eliminar este requisito porque ya tiene historial. Puedes desactivarlo.",
        )

    formatos = (
        db.query(FormatoEmpresaModel)
        .filter(FormatoEmpresaModel.id_tipo_documento_empresa == id_tipo_documento_empresa)
        .all()
    )
    rutas_formato = [Path(formato.ruta_archivo) for formato in formatos if formato.ruta_archivo]
    for formato in formatos:
        db.delete(formato)
    db.delete(tipo)
    db.commit()

    for ruta in rutas_formato:
        try:
            if ruta.exists() and ruta.is_file():
                ruta.unlink()
        except OSError as error:
            logger.warning("No se pudo eliminar el archivo fisico del formato %s: %s", ruta, error)

    return {"mensaje": "Requisito y formatos asociados eliminados correctamente"}


@router.patch(
    "/coord-unidades/documentos-empresa/{id_documento_empresa}/estado",
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)
def revisar_documento_empresa(
    id_documento_empresa: int,
    datos: RevisarDocumentoEmpresaRequest,
    db: Session = Depends(obtener_db),
    usuario_actual: UsuarioModel = Depends(obtener_usuario_actual),
):
    if datos.estado_documento not in {"Aprobado", "Rechazado", "Pendiente", "Con observaciones"}:
        raise HTTPException(status_code=400, detail="Estado de documento no valido")

    documento = (
        db.query(DocumentoEmpresaModel)
        .filter(DocumentoEmpresaModel.id_documento_empresa == id_documento_empresa)
        .first()
    )
    if documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == documento.id_empresa).first()
    estado_anterior = documento.estado_documento
    ahora = datetime.now()

    if datos.estado_documento == "Pendiente" and estado_anterior != "Pendiente":
        if documento.fecha_revision is None:
            raise HTTPException(status_code=400, detail="No hay revision reciente para deshacer")
        if ahora - documento.fecha_revision > timedelta(minutes=10):
            raise HTTPException(status_code=400, detail="Solo se puede deshacer la revision durante los primeros 10 minutos")
        if empresa is not None:
            tiene_vacantes = db.query(VacanteModel).filter(VacanteModel.id_empresa == empresa.id_empresa).first() is not None
            tiene_participacion_aceptada = (
                db.query(ParticipacionEmpresaConvocatoriaModel)
                .filter(
                    ParticipacionEmpresaConvocatoriaModel.id_empresa == empresa.id_empresa,
                    ParticipacionEmpresaConvocatoriaModel.estado == "Aceptada",
                )
                .first()
                is not None
            )
            if (
                empresa.estado_empresa == "Activa"
                or tiene_vacantes
                or tiene_participacion_aceptada
                or obtener_convenio_vigente_actual(db, empresa.id_empresa) is not None
                or obtener_vinculacion_aprobada_actual(db, empresa.id_empresa) is not None
            ):
                raise HTTPException(
                    status_code=400,
                    detail="No se puede deshacer la revision porque la empresa ya avanzo a otra etapa",
                )

    documento.estado_documento = datos.estado_documento
    if datos.estado_documento == "Pendiente":
        marca = f"Revision deshecha por usuario {usuario_actual.id_usuario}."
        documento.observaciones = "\n".join(
            parte for parte in [documento.observaciones, marca, datos.observaciones] if parte
        )
        documento.fecha_revision = None
        documento.revisado_por = None
    else:
        documento.observaciones = datos.observaciones
        documento.fecha_revision = ahora
        documento.revisado_por = usuario_actual.id_usuario
    if empresa is not None:
        _recalcular_estado_empresa(db, empresa)
        _sincronizar_convenio_desde_documento(
            db,
            documento,
            empresa,
            fecha_inicio=datos.fecha_inicio_convenio,
            fecha_fin=datos.fecha_fin_convenio,
        )
        _recalcular_estado_empresa(db, empresa)
        responsables = (
            db.query(ResponsableEmpresaModel)
            .filter(ResponsableEmpresaModel.id_empresa == empresa.id_empresa)
            .all()
        )
        for responsable in responsables:
            crear_notificacion(
                db,
                responsable.id_usuario,
                f"Documento de empresa {datos.estado_documento.lower()}",
                f"El documento {documento.nombre_archivo} fue marcado como {datos.estado_documento}."
                + (f" Observaciones: {datos.observaciones}" if datos.observaciones else ""),
            )

    registrar_bitacora(
        db,
        usuario_actual.id_usuario,
        "Deshacer revision documental" if datos.estado_documento == "Pendiente" and estado_anterior != "Pendiente" else "Revisar documento de empresa",
        "documentos",
        f"Documento de empresa {documento.id_documento_empresa} cambio de {estado_anterior} a {datos.estado_documento}.",
        "documento_empresa",
        documento.id_documento_empresa,
    )
    db.commit()
    db.refresh(documento)
    return _documento_response(documento)


@router.put(
    "/coord-unidades/documentos-empresa/{id_documento_empresa}/archivo",
    dependencies=[Depends(requerir_roles(["Coordinador de Unidades Receptoras", "Administrador"]))],
)
def reemplazar_documento_empresa_por_coordinacion(
    id_documento_empresa: int,
    datos: EditarDocumentoEmpresaRequest,
    db: Session = Depends(obtener_db),
):
    documento = (
        db.query(DocumentoEmpresaModel)
        .filter(DocumentoEmpresaModel.id_documento_empresa == id_documento_empresa)
        .first()
    )
    if documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    contenido = _decode_base64(datos.contenido_base64)
    validar_documento_usuario(contenido, datos.nombre_archivo, datos.mime_type)

    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == documento.id_empresa).first()
    tipo = (
        db.query(TipoDocumentoEmpresaModel)
        .filter(TipoDocumentoEmpresaModel.id_tipo_documento_empresa == documento.id_tipo_documento_empresa)
        .first()
    )
    if empresa is None or tipo is None:
        raise HTTPException(status_code=404, detail="Empresa o tipo de documento no encontrado")
    safe_name = _safe_filename(datos.nombre_archivo)
    carpeta = _carpeta_documento_empresa(db, empresa, tipo)
    carpeta.mkdir(parents=True, exist_ok=True)
    ruta = carpeta / f"coord_{documento.id_documento_empresa}_{uuid4().hex}_{safe_name}"
    ruta.write_bytes(contenido)

    documento.nombre_archivo = safe_name
    documento.ruta_archivo = str(ruta)
    documento.estado_documento = "Pendiente"
    documento.observaciones = datos.observaciones
    documento.fecha_revision = None

    if empresa is not None:
        empresa.estado_empresa = "Pendiente"
        responsables = (
            db.query(ResponsableEmpresaModel)
            .filter(ResponsableEmpresaModel.id_empresa == empresa.id_empresa)
            .all()
        )
        for responsable in responsables:
            crear_notificacion(
                db,
                responsable.id_usuario,
                "Documento de empresa actualizado",
                f"Coordinacion actualizo el archivo {documento.nombre_archivo}. Quedo pendiente de revision.",
            )

    db.commit()
    db.refresh(documento)
    return _documento_response(documento)
