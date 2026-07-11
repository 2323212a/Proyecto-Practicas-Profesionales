from __future__ import annotations

import base64
import logging
import re
from pathlib import Path
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.services.notificacion_service import notificar_roles
from app.services.documentacion_flujo_service import serializar_documentacion, subir_archivo_alumno
from app.services.documentacion_generada_service import generar_documento_oficial, precalentar_documentos_oficiales
from infrastructure.database.dependencies import obtener_db
from infrastructure.security.auth_dependencies import obtener_id_alumno_actual, requerir_alumno_actual_o_roles
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.documento import DocumentoModel
from infrastructure.persistence.models.expediente import ExpedienteModel
from infrastructure.persistence.models.tipo_documento import TipoDocumentoModel


logger = logging.getLogger(__name__)

router = APIRouter(
    prefix="/alumno/documentos",
    tags=["Alumno - Documentos"],
    dependencies=[Depends(requerir_alumno_actual_o_roles(["Administrador"]))],
)
UPLOAD_DIR = Path(__file__).resolve().parents[3] / "uploads" / "documentos"


class SubirDocumentoAlumnoRequest(BaseModel):
    id_tipo_documento: int
    nombre_archivo: str
    contenido_base64: str
    mime_type: str = "application/pdf"


def _convocatoria_vigente(db: Session):
    activa = (
        db.query(ConvocatoriaModel)
        .filter(ConvocatoriaModel.estado == "Activa")
        .order_by(ConvocatoriaModel.fecha_inicio.desc())
        .first()
    )
    if activa is not None:
        return activa
    return db.query(ConvocatoriaModel).order_by(ConvocatoriaModel.fecha_inicio.desc()).first()


def _safe_filename(filename: str) -> str:
    name = Path(filename).name.strip() or "documento.pdf"
    return re.sub(r"[^A-Za-z0-9._-]", "_", name)


def _decode_base64(content: str) -> bytes:
    payload = content.split(",", 1)[1] if "," in content else content
    try:
        return base64.b64decode(payload, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Archivo base64 invalido") from exc


def _requiere_prevalidacion(tipo: TipoDocumentoModel) -> bool:
    texto = f"{tipo.nombre_documento} {tipo.descripcion or ''}".lower()
    return any(clave in texto for clave in ["imss", "seguro", "vigencia"])


def _estado_prevalidacion(tipo: TipoDocumentoModel, nombre_archivo: str, mime_type: str) -> str:
    if not _requiere_prevalidacion(tipo):
        return "No validado"
    nombre = nombre_archivo.lower()
    if mime_type == "application/pdf" and any(clave in nombre for clave in ["imss", "seguro", "vigencia", "derechos"]):
        return "Prevalidado"
    return "Revision manual"


def _documento_response(documento: DocumentoModel):
    observacion = (
        documento.observaciones[-1].descripcion
        if documento.observaciones
        else None
    )
    return {
        "id_documento": documento.id_documento,
        "id_expediente": documento.id_expediente,
        "id_tipo_documento": documento.id_tipo_documento,
        "nombre_archivo": documento.nombre_archivo,
        "ruta_archivo": documento.ruta_archivo,
        "url": f"/uploads/documentos/{Path(documento.ruta_archivo).name}",
        "estado_documento": documento.estado_documento,
        "fecha_carga": documento.fecha_carga.isoformat(),
        "generado_por_sistema": documento.generado_por_sistema,
        "requiere_validacion_automatica": documento.requiere_validacion_automatica,
        "validacion_automatica_estado": documento.validacion_automatica_estado,
        "fecha_validacion_automatica": (
            documento.fecha_validacion_automatica.isoformat()
            if documento.fecha_validacion_automatica
            else None
        ),
        "ultima_observacion": observacion,
    }


def _asegurar_expediente(db: Session, alumno: AlumnoModel) -> ExpedienteModel:
    convocatoria = _convocatoria_vigente(db)
    if convocatoria is None:
        raise HTTPException(status_code=400, detail="No hay convocatoria registrada")

    expediente = (
        db.query(ExpedienteModel)
        .filter(
            ExpedienteModel.id_alumno == alumno.id_alumno,
            ExpedienteModel.id_convocatoria == convocatoria.id_convocatoria,
        )
        .first()
    )
    if expediente is not None:
        return expediente

    expediente = ExpedienteModel(
        id_alumno=alumno.id_alumno,
        id_convocatoria=convocatoria.id_convocatoria,
        estado_expediente="En Revision",
    )
    db.add(expediente)
    db.commit()
    db.refresh(expediente)
    return expediente


@router.get("/me/")
def listar_mis_documentos_alumno(
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    return listar_documentos_alumno(id_alumno, db)


@router.post("/me/subir")
def subir_mi_documento_alumno(
    datos: SubirDocumentoAlumnoRequest,
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    return subir_documento_alumno(id_alumno, datos, db)


@router.get("/{id_alumno:int}")
def listar_documentos_alumno(id_alumno: int, db: Session = Depends(obtener_db)):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    expediente = _asegurar_expediente(db, alumno)
    tipos = db.query(TipoDocumentoModel).order_by(TipoDocumentoModel.etapa.asc()).all()
    documentos = (
        db.query(DocumentoModel)
        .filter(DocumentoModel.id_expediente == expediente.id_expediente)
        .all()
    )
    por_tipo = {documento.id_tipo_documento: documento for documento in documentos}

    return {
        "id_expediente": expediente.id_expediente,
        "estado_expediente": expediente.estado_expediente,
        "tipos_documento": [
            {
                "id_tipo_documento": tipo.id_tipo_documento,
                "nombre_documento": tipo.nombre_documento,
                "descripcion": tipo.descripcion,
                "etapa": tipo.etapa,
                "obligatorio": tipo.obligatorio,
                "requiere_formato": tipo.requiere_formato,
                "requiere_validacion_automatica": _requiere_prevalidacion(tipo),
                "documento": (
                    _documento_response(por_tipo[tipo.id_tipo_documento])
                    if tipo.id_tipo_documento in por_tipo
                    else None
                ),
            }
            for tipo in tipos
        ],
    }


@router.post("/{id_alumno:int}/subir")
def subir_documento_alumno(
    id_alumno: int,
    datos: SubirDocumentoAlumnoRequest,
    db: Session = Depends(obtener_db),
):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    tipo = (
        db.query(TipoDocumentoModel)
        .filter(TipoDocumentoModel.id_tipo_documento == datos.id_tipo_documento)
        .first()
    )
    if tipo is None:
        raise HTTPException(status_code=404, detail="Tipo de documento no encontrado")

    if datos.mime_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")

    contenido = _decode_base64(datos.contenido_base64)
    if len(contenido) > 8 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El documento no debe superar 8 MB")

    expediente = _asegurar_expediente(db, alumno)
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)

    safe_name = _safe_filename(datos.nombre_archivo)
    stored_name = f"{alumno.matricula}_{uuid4().hex}_{safe_name}"
    ruta = UPLOAD_DIR / stored_name
    ruta.write_bytes(contenido)

    requiere_auto = _requiere_prevalidacion(tipo)
    estado_auto = _estado_prevalidacion(tipo, safe_name, datos.mime_type)

    documento = (
        db.query(DocumentoModel)
        .filter(
            DocumentoModel.id_expediente == expediente.id_expediente,
            DocumentoModel.id_tipo_documento == datos.id_tipo_documento,
        )
        .first()
    )
    if documento is None:
        documento = DocumentoModel(
            id_expediente=expediente.id_expediente,
            id_tipo_documento=datos.id_tipo_documento,
            nombre_archivo=safe_name,
            ruta_archivo=str(ruta),
            estado_documento="Pendiente",
            generado_por_sistema=False,
            requiere_validacion_automatica=requiere_auto,
            validacion_automatica_estado=estado_auto,
        )
        db.add(documento)
    else:
        if documento.estado_documento == "Aprobado":
            try:
                ruta.unlink(missing_ok=True)
            except OSError as error:
                logger.warning("No se pudo retirar el archivo temporal %s: %s", ruta, error)
            raise HTTPException(
                status_code=400,
                detail="El documento ya fue aprobado y no puede reemplazarse",
            )
        documento.nombre_archivo = safe_name
        documento.ruta_archivo = str(ruta)
        documento.estado_documento = "Pendiente"
        documento.requiere_validacion_automatica = requiere_auto
        documento.validacion_automatica_estado = estado_auto

    expediente.estado_expediente = "En Revision"
    notificar_roles(
        db,
        ["Coordinador de Practicas", "Administrador"],
        "Documento de alumno recibido",
        f"{alumno.matricula} subio {tipo.nombre_documento} para revision.",
    )
    db.commit()
    db.refresh(documento)
    return _documento_response(documento)



@router.get("/documentacion")
def obtener_documentacion_actual(
    background_tasks: BackgroundTasks,
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    documentacion = serializar_documentacion(db, alumno)
    codigos = [
        item["codigo_generacion"]
        for item in documentacion["documentos"]
        if item.get("codigo_generacion") and item.get("puede_descargar_generado")
    ]
    if codigos:
        background_tasks.add_task(precalentar_documentos_oficiales, id_alumno, codigos)
    return documentacion


@router.get("/generados/{codigo}/descargar")
def descargar_documento_generado_actual(
    codigo: str,
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    documentacion = serializar_documentacion(db, alumno)
    documento = next(
        (
            item
            for item in documentacion["documentos"]
            if item.get("codigo_generacion") == codigo
        ),
        None,
    )
    if documento is None:
        raise HTTPException(status_code=404, detail="Documento oficial no encontrado")
    if not documento.get("puede_descargar_generado"):
        raise HTTPException(
            status_code=403,
            detail="Este documento oficial aun no esta habilitado",
        )

    ruta, filename, media_type = generar_documento_oficial(codigo, alumno)
    return FileResponse(ruta, media_type=media_type, filename=filename)


@router.post("/documentos/{id_documento}/archivo")
def subir_archivo_documentacion_actual(
    id_documento: int,
    archivo: UploadFile = File(...),
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    return subir_archivo_alumno(db, alumno, id_documento, archivo)


@router.get("/documentos/{id_documento}/archivo")
def descargar_archivo_documentacion_actual(
    id_documento: int,
    id_alumno: int = Depends(obtener_id_alumno_actual),
    db: Session = Depends(obtener_db),
):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    expediente = _asegurar_expediente(db, alumno)
    documento = (
        db.query(DocumentoModel)
        .filter(
            DocumentoModel.id_documento == id_documento,
            DocumentoModel.id_expediente == expediente.id_expediente,
        )
        .first()
    )
    if documento is None or not documento.ruta_archivo:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    ruta = Path(documento.ruta_archivo)
    if not ruta.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(ruta, media_type="application/pdf", filename=documento.nombre_archivo)
