from __future__ import annotations

import base64
import logging
import re
from datetime import date, datetime, timedelta
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.services.convenio_empresa_service import (
    activar_convenio_actual,
    obtener_convenio_actual,
)
from app.services.notificacion_service import crear_notificacion, notificar_roles
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import obtener_id_empresa_actual, requerir_empresa_actual_o_roles, requerir_roles
from infrastructure.persistence.models.convenio import ConvenioModel
from infrastructure.persistence.models.documento_empresa import DocumentoEmpresaModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.formato_empresa import FormatoEmpresaModel
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel
from infrastructure.persistence.models.tipo_documento_empresa import TipoDocumentoEmpresaModel


logger = logging.getLogger(__name__)

router = APIRouter(tags=["Documentacion de Empresas"])
UPLOAD_DOCUMENTOS_DIR = Path(__file__).resolve().parents[3] / "uploads" / "documentos_empresa"
UPLOAD_FORMATOS_DIR = Path(__file__).resolve().parents[3] / "uploads" / "formatos_empresa"
FORMATOS_MIME_PERMITIDOS = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}


class SubirDocumentoEmpresaRequest(BaseModel):
    id_tipo_documento_empresa: int
    nombre_archivo: str
    contenido_base64: str
    mime_type: str = "application/pdf"


class SubirFormatoEmpresaRequest(BaseModel):
    id_tipo_documento_empresa: int
    nombre_archivo: str
    contenido_base64: str
    mime_type: str = "application/pdf"
    descripcion: str | None = None


class RevisarDocumentoEmpresaRequest(BaseModel):
    estado_documento: str
    observaciones: str | None = None
    fecha_inicio_convenio: date | None = None
    fecha_fin_convenio: date | None = None


class EditarDocumentoEmpresaRequest(BaseModel):
    nombre_archivo: str
    contenido_base64: str
    mime_type: str = "application/pdf"
    observaciones: str | None = None


class ConfigurarRequisitoEmpresaRequest(BaseModel):
    nombre: str
    descripcion: str | None = None
    obligatorio: bool = True
    requiere_formato: bool = False
    activo: bool = True
    etapa: str = "Documentacion"


TIPOS_BASE_EMPRESA = [
    ("Formato de registro de unidad receptora", "Datos generales y representante de la empresa.", True, "Documentacion"),
    ("Constancia de situacion fiscal", "Documento fiscal actualizado de la empresa.", False, "Documentacion"),
    ("Comprobante de domicilio", "Comprobante reciente de la direccion registrada.", False, "Documentacion"),
    ("Identificacion del representante legal", "Identificacion oficial del responsable o representante.", False, "Documentacion"),
    ("Convenio o carta compromiso", "Documento institucional para formalizar la colaboracion.", True, "Convenio"),
]


def _safe_filename(filename: str) -> str:
    name = Path(filename).name.strip() or "documento.pdf"
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)


def _decode_base64(content: str) -> bytes:
    payload = content.split(",", 1)[1] if "," in content else content
    try:
        return base64.b64decode(payload, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Archivo base64 invalido") from exc


def _validar_mime_formato(mime_type: str) -> None:
    if mime_type not in FORMATOS_MIME_PERMITIDOS:
        raise HTTPException(
            status_code=400,
            detail="Solo se permiten formatos PDF, DOC o DOCX",
        )


def _validar_etapa(etapa: str) -> str:
    if etapa not in {"Documentacion", "Convenio"}:
        raise HTTPException(status_code=400, detail="La etapa debe ser Documentacion o Convenio")
    return etapa


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
        "nombre_archivo": formato.nombre_archivo,
        "url": f"/uploads/formatos_empresa/{Path(formato.ruta_archivo).name}",
        "mime_type": formato.mime_type,
        "descripcion": formato.descripcion,
        "formato_activo": formato.activo,
        "fecha_actualizacion": formato.fecha_actualizacion.isoformat() if formato.fecha_actualizacion else None,
    }


def _documento_response(documento: DocumentoEmpresaModel | None):
    if documento is None:
        return None
    return {
        "id_documento_empresa": documento.id_documento_empresa,
        "id_empresa": documento.id_empresa,
        "id_tipo_documento_empresa": documento.id_tipo_documento_empresa,
        "nombre_archivo": documento.nombre_archivo,
        "url": f"/uploads/documentos_empresa/{Path(documento.ruta_archivo).name}",
        "mime_type": documento.mime_type,
        "estado_documento": documento.estado_documento,
        "observaciones": documento.observaciones,
        "fecha_carga": documento.fecha_carga.isoformat() if documento.fecha_carga else None,
        "fecha_revision": documento.fecha_revision.isoformat() if documento.fecha_revision else None,
    }


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
    formatos_activos = [formato for formato in tipo.formatos if formato.activo]
    formato = sorted(
        formatos_activos,
        key=lambda item: item.fecha_actualizacion,
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
        "formato": _formato_response(formato),
        "puede_eliminar": (
            _puede_eliminar_requisito(db, tipo.id_tipo_documento_empresa)
            if db is not None
            else False
        ),
    }


def _es_documento_convenio(tipo: TipoDocumentoEmpresaModel | None) -> bool:
    if tipo is None:
        return False
    if tipo.etapa == "Convenio":
        return True
    texto = f"{tipo.nombre} {tipo.descripcion or ''}".lower()
    return "convenio" in texto or "carta compromiso" in texto


def _url_documento_empresa(documento: DocumentoEmpresaModel) -> str:
    return f"/uploads/documentos_empresa/{Path(documento.ruta_archivo).name}"


def _documentacion_legal_aprobada(db: Session, id_empresa: int) -> bool:
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
    if empresa is None or not _es_documento_convenio(tipo_documento):
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

        # Primero reutiliza una renovacion pendiente. Si el mismo documento ya
        # estaba aprobado y se vuelve a revisar, actualiza el convenio ligado
        # en lugar de crear un duplicado.
        convenio_objetivo = (
            db.query(ConvenioModel)
            .filter(
                ConvenioModel.id_empresa == empresa.id_empresa,
                ConvenioModel.id_documento_empresa == documento.id_documento_empresa,
                ConvenioModel.estado_convenio == "Pendiente",
            )
            .order_by(ConvenioModel.id_convenio.desc())
            .first()
        )
        if convenio_objetivo is None:
            convenio_objetivo = (
                db.query(ConvenioModel)
                .filter(
                    ConvenioModel.id_empresa == empresa.id_empresa,
                    ConvenioModel.id_documento_empresa == documento.id_documento_empresa,
                )
                .order_by(
                    ConvenioModel.es_actual.desc(),
                    ConvenioModel.id_convenio.desc(),
                )
                .first()
            )

        if convenio_objetivo is None:
            version = (
                db.query(ConvenioModel)
                .filter(ConvenioModel.id_empresa == empresa.id_empresa)
                .count()
                + 1
            )
            convenio_objetivo = ConvenioModel(
                id_empresa=empresa.id_empresa,
                fecha_inicio=inicio,
                fecha_fin=fin,
                documento_convenio=_url_documento_empresa(documento),
                id_documento_empresa=documento.id_documento_empresa,
                version=version,
                es_actual=False,
                renovacion_solicitada=False,
                estado_convenio="Pendiente",
            )
            db.add(convenio_objetivo)
            db.flush()

        activar_convenio_actual(
            db,
            empresa,
            convenio_objetivo,
            fecha_inicio=inicio,
            fecha_fin=fin,
            documento_convenio=_url_documento_empresa(documento),
        )
        return

    if documento.estado_documento == "Pendiente":
        pendiente = (
            db.query(ConvenioModel)
            .filter(
                ConvenioModel.id_empresa == empresa.id_empresa,
                ConvenioModel.id_documento_empresa == documento.id_documento_empresa,
                ConvenioModel.estado_convenio == "Pendiente",
            )
            .order_by(ConvenioModel.id_convenio.desc())
            .first()
        )
        if pendiente is None:
            version = (
                db.query(ConvenioModel)
                .filter(ConvenioModel.id_empresa == empresa.id_empresa)
                .count()
                + 1
            )
            db.add(
                ConvenioModel(
                    id_empresa=empresa.id_empresa,
                    fecha_inicio=date.today(),
                    fecha_fin=date.today(),
                    documento_convenio=_url_documento_empresa(documento),
                    id_documento_empresa=documento.id_documento_empresa,
                    version=version,
                    es_actual=False,
                    renovacion_solicitada=False,
                    estado_convenio="Pendiente",
                )
            )
        else:
            pendiente.documento_convenio = _url_documento_empresa(documento)
        if convenio_actual is not None:
            convenio_actual.renovacion_solicitada = False
        return

    if convenio_actual is not None and documento.estado_documento == "Rechazado":
        convenio_actual.renovacion_solicitada = True

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
        if tipo.etapa == "Convenio" and not documentacion_legal_aprobada:
            continue
        formatos_activos = [formato for formato in tipo.formatos if formato.activo]
        formato = sorted(
            formatos_activos,
            key=lambda item: item.fecha_actualizacion,
            reverse=True,
        )[0] if formatos_activos else None
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
        },
        "resumen": resumen,
        "convenio_actual": (
            {
                "id_convenio": convenio_actual.id_convenio,
                "fecha_inicio": convenio_actual.fecha_inicio.isoformat(),
                "fecha_fin": convenio_actual.fecha_fin.isoformat(),
                "estado_convenio": convenio_actual.estado_convenio,
                "version": convenio_actual.version,
                "renovacion_solicitada": convenio_actual.renovacion_solicitada,
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
    if tipo.etapa == "Convenio" and not _documentacion_legal_aprobada(db, id_empresa):
        raise HTTPException(
            status_code=400,
            detail="El convenio se habilita cuando la documentacion legal obligatoria esta aprobada",
        )
    if datos.mime_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")

    contenido = _decode_base64(datos.contenido_base64)
    if len(contenido) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El documento no debe superar 10 MB")

    UPLOAD_DOCUMENTOS_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = _safe_filename(datos.nombre_archivo)
    stored_name = f"empresa_{id_empresa}_{uuid4().hex}_{safe_name}"
    ruta = UPLOAD_DOCUMENTOS_DIR / stored_name
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
            mime_type=datos.mime_type,
            estado_documento="Pendiente",
        )
        db.add(documento)
    else:
        documento.nombre_archivo = safe_name
        documento.ruta_archivo = str(ruta)
        documento.mime_type = datos.mime_type
        documento.estado_documento = "Pendiente"
        documento.observaciones = None
        documento.fecha_revision = None

    # El id del documento es necesario para enlazar de forma idempotente la
    # version pendiente del convenio. Sin este flush, un documento nuevo queda
    # con id_documento_empresa NULL y la aprobacion puede crear duplicados.
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
    _validar_mime_formato(datos.mime_type)

    contenido = _decode_base64(datos.contenido_base64)
    if len(contenido) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El formato no debe superar 10 MB")

    UPLOAD_FORMATOS_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = _safe_filename(datos.nombre_archivo)
    stored_name = f"formato_empresa_{tipo.id_tipo_documento_empresa}_{uuid4().hex}_{safe_name}"
    ruta = UPLOAD_FORMATOS_DIR / stored_name
    ruta.write_bytes(contenido)

    db.query(FormatoEmpresaModel).filter(
        FormatoEmpresaModel.id_tipo_documento_empresa == tipo.id_tipo_documento_empresa
    ).update({"activo": False})

    formato = FormatoEmpresaModel(
        id_tipo_documento_empresa=tipo.id_tipo_documento_empresa,
        nombre_archivo=safe_name,
        ruta_archivo=str(ruta),
        mime_type=datos.mime_type,
        descripcion=datos.descripcion,
        activo=True,
    )
    db.add(formato)
    notificar_roles(
        db,
        ["Unidad Receptora"],
        "Formato de empresa actualizado",
        f"Coordinacion actualizo el formato de {tipo.nombre}.",
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

    duplicado = (
        db.query(TipoDocumentoEmpresaModel)
        .filter(
            TipoDocumentoEmpresaModel.nombre == nombre,
            TipoDocumentoEmpresaModel.etapa == etapa,
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

    duplicado = (
        db.query(TipoDocumentoEmpresaModel)
        .filter(
            TipoDocumentoEmpresaModel.nombre == nombre,
            TipoDocumentoEmpresaModel.etapa == etapa,
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
):
    if datos.estado_documento not in {"Aprobado", "Rechazado", "Pendiente"}:
        raise HTTPException(status_code=400, detail="Estado de documento no valido")

    documento = (
        db.query(DocumentoEmpresaModel)
        .filter(DocumentoEmpresaModel.id_documento_empresa == id_documento_empresa)
        .first()
    )
    if documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")

    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == documento.id_empresa).first()
    documento.estado_documento = datos.estado_documento
    documento.observaciones = datos.observaciones
    documento.fecha_revision = datetime.now()
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
    if datos.mime_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")

    contenido = _decode_base64(datos.contenido_base64)
    if len(contenido) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El documento no debe superar 10 MB")

    empresa = db.query(EmpresaModel).filter(EmpresaModel.id_empresa == documento.id_empresa).first()
    UPLOAD_DOCUMENTOS_DIR.mkdir(parents=True, exist_ok=True)
    safe_name = _safe_filename(datos.nombre_archivo)
    stored_name = f"coord_empresa_{documento.id_empresa}_{uuid4().hex}_{safe_name}"
    ruta = UPLOAD_DOCUMENTOS_DIR / stored_name
    ruta.write_bytes(contenido)

    documento.nombre_archivo = safe_name
    documento.ruta_archivo = str(ruta)
    documento.mime_type = datos.mime_type
    documento.estado_documento = "Pendiente"
    documento.observaciones = datos.observaciones
    documento.fecha_carga = datetime.now()
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
