from __future__ import annotations

import base64
import re
from datetime import datetime
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session, joinedload

from app.services.notificacion_service import crear_notificacion, notificar_roles
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import obtener_id_empresa_actual, requerir_empresa_actual_o_roles, requerir_roles
from infrastructure.persistence.models.documento_empresa import DocumentoEmpresaModel
from infrastructure.persistence.models.empresa import EmpresaModel
from infrastructure.persistence.models.formato_empresa import FormatoEmpresaModel
from infrastructure.persistence.models.responsable_empresa import ResponsableEmpresaModel
from infrastructure.persistence.models.tipo_documento_empresa import TipoDocumentoEmpresaModel


router = APIRouter(tags=["Documentacion de Empresas"])
UPLOAD_DOCUMENTOS_DIR = Path(__file__).resolve().parents[3] / "uploads" / "documentos_empresa"
UPLOAD_FORMATOS_DIR = Path(__file__).resolve().parents[3] / "uploads" / "formatos_empresa"


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


TIPOS_BASE_EMPRESA = [
    ("Formato de registro de unidad receptora", "Datos generales y representante de la empresa.", True),
    ("Constancia de situacion fiscal", "Documento fiscal actualizado de la empresa.", False),
    ("Comprobante de domicilio", "Comprobante reciente de la direccion registrada.", False),
    ("Identificacion del representante legal", "Identificacion oficial del responsable o representante.", False),
    ("Convenio o carta compromiso", "Documento institucional para formalizar la colaboracion.", True),
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


def _asegurar_tipos_base(db: Session) -> None:
    if db.query(TipoDocumentoEmpresaModel).count() > 0:
        return

    for nombre, descripcion, requiere_formato in TIPOS_BASE_EMPRESA:
        db.add(
            TipoDocumentoEmpresaModel(
                nombre=nombre,
                descripcion=descripcion,
                obligatorio=True,
                requiere_formato=requiere_formato,
                activo=True,
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


def _recalcular_estado_empresa(db: Session, empresa: EmpresaModel) -> None:
    tipos_obligatorios = (
        db.query(TipoDocumentoEmpresaModel)
        .filter(
            TipoDocumentoEmpresaModel.activo == True,
            TipoDocumentoEmpresaModel.obligatorio == True,
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
        empresa.estado_empresa = "Activa"
        return

    empresa.estado_empresa = "Pendiente"


def _empresa_documentacion_response(db: Session, empresa: EmpresaModel):
    _asegurar_tipos_base(db)
    tipos = (
        db.query(TipoDocumentoEmpresaModel)
        .options(joinedload(TipoDocumentoEmpresaModel.formatos))
        .filter(TipoDocumentoEmpresaModel.activo == True)
        .order_by(TipoDocumentoEmpresaModel.id_tipo_documento_empresa.asc())
        .all()
    )
    documentos = (
        db.query(DocumentoEmpresaModel)
        .filter(DocumentoEmpresaModel.id_empresa == empresa.id_empresa)
        .all()
    )
    por_tipo = {documento.id_tipo_documento_empresa: documento for documento in documentos}

    items = []
    for tipo in tipos:
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
                "requiere_formato": tipo.requiere_formato,
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
    if not tipo.requiere_formato:
        tipo.requiere_formato = True
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

    empresa.estado_empresa = "Pendiente"
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
    tipo = (
        db.query(TipoDocumentoEmpresaModel)
        .filter(TipoDocumentoEmpresaModel.id_tipo_documento_empresa == datos.id_tipo_documento_empresa)
        .first()
    )
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de documento no encontrado")
    if datos.mime_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")

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
