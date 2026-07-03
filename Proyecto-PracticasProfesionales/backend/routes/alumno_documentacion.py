from datetime import datetime
from pathlib import Path
import shutil

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from database.dependencies import obtener_db
from models.alumno import AlumnoModel
from models.carrera import CarreraModel
from models.documento import DocumentoModel
from models.expediente import ExpedienteModel
from models.tipo_documento import TipoDocumentoModel
from models.usuario import UsuarioModel
from security.jwt import ALGORITHM, SECRET_KEY

router = APIRouter(prefix="/alumno", tags=["Alumno Documentacion"])
security = HTTPBearer()

UPLOAD_DIR = Path(__file__).resolve().parent.parent / "uploads" / "expedientes"

DOCUMENTOS_FLUJO = [
    {"nombre": "Historial Academico", "descripcion": "Primer filtro para verificar si el alumno cumple con los creditos y condiciones academicas necesarias.", "instrucciones": "Debe ser legible, estar actualizado y corresponder al alumno.", "etapa": "elegibilidad", "obligatorio": True, "sistema": False},
    {"nombre": "Vigencia de Derechos", "descripcion": "Documento que acredita que el alumno cuenta con vigencia de derechos para continuar el tramite.", "instrucciones": "Debe estar vigente, legible y en formato PDF.", "etapa": "elegibilidad", "obligatorio": True, "sistema": False},
    {"nombre": "Carta Compromiso", "descripcion": "Documento firmado por el alumno donde acepta cumplir con las responsabilidades del programa de practicas profesionales.", "instrucciones": "Debe estar llenada, firmada, legible y en formato PDF.", "etapa": "expediente", "obligatorio": True, "sistema": False},
    {"nombre": "Carta de Exoneracion", "descripcion": "Documento donde el alumno acepta responsabilidades externas durante sus practicas.", "instrucciones": "Debe incluir firma del alumno y Vo.Bo. del padre o tutor.", "etapa": "expediente", "obligatorio": True, "sistema": False},
    {"nombre": "Credencial del Alumno", "descripcion": "Copia digital de la credencial vigente del alumno.", "instrucciones": "Debe verse completa, clara y sin recortes importantes.", "etapa": "expediente", "obligatorio": True, "sistema": False},
    {"nombre": "Credencial del Tutor", "descripcion": "Documento usado para confirmar la identidad del tutor que firma la carta de exoneracion.", "instrucciones": "Debe ser clara, legible y corresponder al tutor firmante.", "etapa": "expediente", "obligatorio": True, "sistema": False},
    {"nombre": "Solicitud de Practicas Profesionales", "descripcion": "Formato interno con los datos generales del alumno para integrar el expediente inicial.", "instrucciones": "Debe estar completo, firmado y en formato PDF.", "etapa": "expediente", "obligatorio": True, "sistema": False},
    {"nombre": "Carta de Exposicion de Motivos", "descripcion": "Documento generado despues de que el alumno selecciona sus opciones de empresa.", "instrucciones": "El alumno debe descargarlo, firmarlo, escanearlo y subirlo nuevamente.", "etapa": "seleccion_empresa", "obligatorio": True, "sistema": False},
    {"nombre": "Carta de Colaboracion", "descripcion": "Documento emitido por coordinacion para formalizar la colaboracion entre la institucion y la unidad receptora.", "instrucciones": "Documento enviado por coordinacion cuando el expediente y seleccion estan validados.", "etapa": "asignacion", "obligatorio": True, "sistema": True},
    {"nombre": "Carta de Presentacion", "descripcion": "Documento oficial emitido por la institucion para presentar al alumno ante la unidad receptora.", "instrucciones": "Documento enviado por coordinacion despues de aprobar la seleccion de empresa.", "etapa": "asignacion", "obligatorio": True, "sistema": True},
    {"nombre": "Carta de Asignacion", "descripcion": "Documento que confirma la asignacion del alumno a una unidad receptora.", "instrucciones": "Documento enviado por coordinacion una vez autorizada la asignacion.", "etapa": "asignacion", "obligatorio": True, "sistema": True},
    {"nombre": "Carta de Colaboracion Firmada", "descripcion": "Sube la carta de colaboracion ya firmada y completamente llenada.", "instrucciones": "Formato permitido: PDF. El documento debe ser claro, legible y estar completo.", "etapa": "asignacion_firmada", "obligatorio": True, "sistema": False},
    {"nombre": "Carta de Presentacion Firmada", "descripcion": "Sube la carta de presentacion ya firmada por las partes correspondientes.", "instrucciones": "Formato permitido: PDF. El documento debe ser claro, legible y estar completo.", "etapa": "asignacion_firmada", "obligatorio": True, "sistema": False},
    {"nombre": "Carta de Asignacion Firmada", "descripcion": "Sube la carta de asignacion ya firmada para continuar con el proceso.", "instrucciones": "Formato permitido: PDF. El documento debe ser claro, legible y estar completo.", "etapa": "asignacion_firmada", "obligatorio": True, "sistema": False},
]

ORDEN_DOCUMENTOS = {doc["nombre"]: index for index, doc in enumerate(DOCUMENTOS_FLUJO)}


def obtener_usuario_actual(credenciales: HTTPAuthorizationCredentials = Depends(security), db: Session = Depends(obtener_db)):
    try:
        payload = jwt.decode(credenciales.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        id_usuario = int(payload.get("sub"))
    except (JWTError, TypeError, ValueError):
        raise HTTPException(status_code=401, detail="Token invalido")

    usuario = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == id_usuario).first()
    if usuario is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return usuario


def generar_nomenclatura(nombre_documento: str, matricula: str):
    nombre = nombre_documento.lower()
    for origen, destino in {" ": "_", "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", "ñ": "n"}.items():
        nombre = nombre.replace(origen, destino)
    return f"{nombre}_{matricula}.pdf"


def obtener_definicion(nombre: str):
    return next((doc for doc in DOCUMENTOS_FLUJO if doc["nombre"] == nombre), None)


def obtener_o_crear_tipo(db: Session, definicion: dict):
    tipo = db.query(TipoDocumentoModel).filter(TipoDocumentoModel.nombre_documento == definicion["nombre"]).first()
    if tipo is None:
        tipo = TipoDocumentoModel(nombre_documento=definicion["nombre"])
        db.add(tipo)
        db.flush()
    tipo.descripcion = definicion["descripcion"]
    tipo.etapa = definicion["etapa"]
    tipo.obligatorio = definicion["obligatorio"]
    return tipo


def obtener_o_crear_expediente(db: Session, alumno: AlumnoModel):
    expediente = db.query(ExpedienteModel).filter(ExpedienteModel.id_alumno == alumno.id_alumno).first()
    if expediente:
        return expediente
    expediente = ExpedienteModel(id_alumno=alumno.id_alumno, id_convocatoria=1, estado_expediente="Pendiente")
    db.add(expediente)
    db.flush()
    return expediente


def asegurar_documentos_expediente(db: Session, alumno: AlumnoModel):
    expediente = obtener_o_crear_expediente(db, alumno)
    for definicion in DOCUMENTOS_FLUJO:
        tipo = obtener_o_crear_tipo(db, definicion)
        documento = db.query(DocumentoModel).filter(
            DocumentoModel.id_expediente == expediente.id_expediente,
            DocumentoModel.id_tipo_documento == tipo.id_tipo_documento,
        ).first()
        if documento is None:
            db.add(DocumentoModel(
                id_expediente=expediente.id_expediente,
                id_tipo_documento=tipo.id_tipo_documento,
                estado_documento="Pendiente",
                generado_por_sistema=definicion["sistema"],
            ))
        else:
            documento.generado_por_sistema = definicion["sistema"]
    db.commit()
    db.refresh(expediente)
    return expediente


def documentos_del_flujo(db: Session, expediente: ExpedienteModel):
    nombres = set(ORDEN_DOCUMENTOS.keys())
    filas = (
        db.query(DocumentoModel, TipoDocumentoModel)
        .join(TipoDocumentoModel, DocumentoModel.id_tipo_documento == TipoDocumentoModel.id_tipo_documento)
        .filter(DocumentoModel.id_expediente == expediente.id_expediente)
        .all()
    )
    filas = [(doc, tipo) for doc, tipo in filas if tipo.nombre_documento in nombres]
    return sorted(filas, key=lambda item: ORDEN_DOCUMENTOS[item[1].nombre_documento])


def calcular_flujo(filas):
    iniciales = [(d, t) for d, t in filas if t.etapa in ["elegibilidad", "expediente"]]
    seleccion = [(d, t) for d, t in filas if t.etapa == "seleccion_empresa"]
    asignacion = [(d, t) for d, t in filas if t.etapa == "asignacion"]

    elegibilidad_aprobada = all(d.estado_documento == "Aprobado" for d, t in filas if t.etapa == "elegibilidad")
    expediente_inicial_aprobado = len(iniciales) > 0 and all(d.estado_documento == "Aprobado" for d, _ in iniciales)
    seleccion_habilitada = expediente_inicial_aprobado
    seleccion_validada = len(seleccion) > 0 and all(d.estado_documento == "Aprobado" for d, _ in seleccion)
    asignacion_habilitada = len(asignacion) > 0 and any(d.nombre_archivo for d, _ in asignacion)
    return elegibilidad_aprobada, expediente_inicial_aprobado, seleccion_habilitada, seleccion_validada, asignacion_habilitada


def serializar_documentacion(db: Session, alumno: AlumnoModel):
    expediente = asegurar_documentos_expediente(db, alumno)
    usuario = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == alumno.id_usuario).first()
    carrera = db.query(CarreraModel).filter(CarreraModel.id_carrera == alumno.id_carrera).first()
    filas = documentos_del_flujo(db, expediente)
    elegibilidad_aprobada, expediente_inicial_aprobado, seleccion_habilitada, seleccion_validada, asignacion_habilitada = calcular_flujo(filas)

    documentos = []
    for documento, tipo in filas:
        definicion = obtener_definicion(tipo.nombre_documento) or {}
        etapa = tipo.etapa
        habilitado = False
        if etapa == "elegibilidad":
            habilitado = True
        elif etapa == "expediente":
            habilitado = elegibilidad_aprobada
        elif etapa == "seleccion_empresa":
            habilitado = seleccion_habilitada
        elif etapa == "asignacion":
            habilitado = asignacion_habilitada
        elif etapa == "asignacion_firmada":
            habilitado = asignacion_habilitada

        documentos.append({
            "id_documento": documento.id_documento,
            "id_tipo_documento": tipo.id_tipo_documento,
            "nombre": tipo.nombre_documento,
            "descripcion": tipo.descripcion,
            "instrucciones": definicion.get("instrucciones"),
            "etapa": etapa,
            "obligatorio": bool(tipo.obligatorio),
            "nombre_archivo": documento.nombre_archivo,
            "ruta_archivo": documento.ruta_archivo,
            "estado": documento.estado_documento,
            "fecha_carga": documento.fecha_carga,
            "generado_por_sistema": bool(documento.generado_por_sistema),
            "habilitado": habilitado,
            "nomenclatura": generar_nomenclatura(tipo.nombre_documento or "documento", alumno.matricula),
            "url_archivo": f"/alumno/documentos/{documento.id_documento}/archivo" if documento.ruta_archivo else None,
        })

    aprobados = sum(1 for d in documentos if d["estado"] == "Aprobado")
    revision = sum(1 for d in documentos if d["nombre_archivo"] and d["estado"] == "Pendiente")
    observados = sum(1 for d in documentos if d["estado"] in ["Observado", "Rechazado"])
    pendientes = sum(1 for d in documentos if not d["nombre_archivo"] and not d["generado_por_sistema"])

    return {
        "alumno": {
            "id_alumno": alumno.id_alumno,
            "id_usuario": alumno.id_usuario,
            "nombre": usuario.nombre if usuario else "Alumno",
            "apellido_paterno": usuario.apellido_paterno if usuario else None,
            "apellido_materno": usuario.apellido_materno if usuario else None,
            "correo": usuario.correo if usuario else None,
            "matricula": alumno.matricula,
            "semestre": alumno.semestre,
            "grupo": alumno.grupo,
            "creditos_aprobados": alumno.creditos_aprobados,
            "estado_alumno": alumno.estado_alumno,
            "carrera": carrera.nombre if carrera else None,
        },
        "expediente": {
            "id_expediente": expediente.id_expediente,
            "estado": expediente.estado_expediente,
            "elegibilidad_aprobada": elegibilidad_aprobada,
            "expediente_inicial_aprobado": expediente_inicial_aprobado,
            "seleccion_habilitada": seleccion_habilitada,
            "seleccion_validada": seleccion_validada,
            "asignacion_habilitada": asignacion_habilitada,
        },
        "resumen": {"aprobados": aprobados, "revision": revision, "observados": observados, "pendientes": pendientes, "total": len(documentos)},
        "documentos": documentos,
    }


def crear_pdf_placeholder(ruta: Path, titulo: str, alumno: AlumnoModel):
    ruta.parent.mkdir(parents=True, exist_ok=True)
    texto = f"{titulo} - {alumno.matricula}".replace("(", "").replace(")", "")
    contenido = f"%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n4 0 obj << /Length 80 >> stream\nBT /F1 18 Tf 72 720 Td ({texto}) Tj ET\nendstream endobj\n5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\nxref\n0 6\n0000000000 65535 f \ntrailer << /Root 1 0 R /Size 6 >>\nstartxref\n0\n%%EOF\n"
    ruta.write_bytes(contenido.encode("latin-1", errors="ignore"))


@router.get("/documentacion")
def obtener_documentacion_alumno(db: Session = Depends(obtener_db), usuario_actual: UsuarioModel = Depends(obtener_usuario_actual)):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_usuario == usuario_actual.id_usuario).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    return serializar_documentacion(db, alumno)


@router.post("/documentos/{id_documento}/archivo")
def subir_documento_alumno(id_documento: int, archivo: UploadFile = File(...), db: Session = Depends(obtener_db), usuario_actual: UsuarioModel = Depends(obtener_usuario_actual)):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_usuario == usuario_actual.id_usuario).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")

    documentacion = serializar_documentacion(db, alumno)
    info_documento = {d["id_documento"]: d for d in documentacion["documentos"]}.get(id_documento)
    if info_documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    if not info_documento["habilitado"] or info_documento["generado_por_sistema"]:
        raise HTTPException(status_code=403, detail="Este documento aun no esta habilitado para carga")
    if not archivo.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")

    documento = db.query(DocumentoModel).filter(DocumentoModel.id_documento == id_documento).first()
    carpeta = UPLOAD_DIR / str(documento.id_expediente)
    carpeta.mkdir(parents=True, exist_ok=True)
    nombre_archivo = generar_nomenclatura(info_documento["nombre"], alumno.matricula)
    destino = carpeta / f"{id_documento}_{nombre_archivo}"
    with destino.open("wb") as buffer:
        shutil.copyfileobj(archivo.file, buffer)

    documento.nombre_archivo = nombre_archivo
    documento.ruta_archivo = str(destino)
    documento.estado_documento = "Pendiente"
    documento.fecha_carga = datetime.now()
    expediente = db.query(ExpedienteModel).filter(ExpedienteModel.id_expediente == documento.id_expediente).first()
    if expediente:
        expediente.estado_expediente = "En Revision"
    db.commit()
    return serializar_documentacion(db, alumno)


@router.get("/documentos/{id_documento}/archivo")
def descargar_documento_alumno(id_documento: int, db: Session = Depends(obtener_db), usuario_actual: UsuarioModel = Depends(obtener_usuario_actual)):
    alumno = db.query(AlumnoModel).filter(AlumnoModel.id_usuario == usuario_actual.id_usuario).first()
    if alumno is None:
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
    expediente = obtener_o_crear_expediente(db, alumno)
    documento = db.query(DocumentoModel).filter(DocumentoModel.id_documento == id_documento, DocumentoModel.id_expediente == expediente.id_expediente).first()
    if documento is None or not documento.ruta_archivo:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    ruta = Path(documento.ruta_archivo)
    if not ruta.exists():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")
    return FileResponse(ruta, media_type="application/pdf", filename=documento.nombre_archivo)