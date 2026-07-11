from __future__ import annotations

from datetime import datetime
from pathlib import Path
import shutil

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.services.documentacion_generada_service import codigo_generacion_por_nombre
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.carrera import CarreraModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.documento import DocumentoModel
from infrastructure.persistence.models.expediente import ExpedienteModel
from infrastructure.persistence.models.tipo_documento import TipoDocumentoModel
from infrastructure.persistence.models.usuario import UsuarioModel


UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "expedientes"

DOCUMENTOS_FLUJO = [
    {"nombre": "Comprobante con materias", "descripcion": "Documento de elegibilidad academica solicitado en SYSWEB.", "instrucciones": "Solicitar en SYSWEB Comprobante con materias. El documento debe ser claro, legible, estar completo y no contener sombras, reflejos, recortes o paginas borrosas.", "etapa": "elegibilidad", "obligatorio": True, "sistema": False},
    {"nombre": "Vigencia de Derechos", "descripcion": "Documento que acredita que el alumno cuenta con vigencia de derechos para continuar el tramite.", "instrucciones": "Descargar en el portal del IMSS. El documento debe ser claro, legible, estar completo y no contener sombras, reflejos, recortes o paginas borrosas.", "etapa": "elegibilidad", "obligatorio": True, "sistema": False},
    {"nombre": "Carta Compromiso", "descripcion": "Documento oficial generado por el sistema. Descargalo, imprime, firma y sube el PDF firmado.", "instrucciones": "Descarga el documento oficial, imprime, completa los espacios pendientes, firma y vuelve a subirlo en formato PDF.", "etapa": "expediente", "obligatorio": True, "sistema": False},
    {"nombre": "Carta de Exoneracion", "descripcion": "Documento oficial generado por el sistema. Descargalo, completa los datos manuales, firma y sube el PDF firmado.", "instrucciones": "Completa a mano los datos de contacto de emergencia y tutor antes de firmar. Sube el documento firmado en formato PDF.", "etapa": "expediente", "obligatorio": True, "sistema": False},
    {"nombre": "Solicitud FO-136", "descripcion": "Solicitud oficial de inscripcion. Descargala, imprime, completa los campos manuales, firma y sube el PDF firmado.", "instrucciones": "La fotografia, datos personales pendientes y firmas deben completarse despues de imprimir. Sube el documento firmado en formato PDF.", "etapa": "expediente", "obligatorio": True, "sistema": False},
    {"nombre": "Credencial del Alumno", "descripcion": "Copia digital de la credencial vigente del alumno.", "instrucciones": "Sube la credencial vigente del alumno en formato PDF. Debe verse completa, clara y sin recortes importantes.", "etapa": "expediente", "obligatorio": True, "sistema": False},
    {"nombre": "Credencial del Tutor", "descripcion": "Copia digital de la credencial del padre, madre o tutor.", "instrucciones": "Sube la credencial del tutor en formato PDF. Debe ser clara, legible y corresponder al tutor firmante.", "etapa": "expediente", "obligatorio": True, "sistema": False},
    {"nombre": "Carta de Exposicion de Motivos", "descripcion": "Documento generado despues de que el alumno selecciona sus opciones de empresa.", "instrucciones": "El alumno debe descargarlo, firmarlo, escanearlo y subirlo nuevamente.", "etapa": "seleccion_empresa", "obligatorio": True, "sistema": False},
    {"nombre": "Carta de Colaboracion", "descripcion": "Documento emitido por coordinacion para formalizar la colaboracion entre la institucion y la unidad receptora.", "instrucciones": "Documento enviado por coordinacion cuando el expediente y seleccion estan validados.", "etapa": "asignacion", "obligatorio": True, "sistema": True},
    {"nombre": "Carta de Presentacion", "descripcion": "Documento oficial emitido por la institucion para presentar al alumno ante la unidad receptora.", "instrucciones": "Documento enviado por coordinacion despues de aprobar la seleccion de empresa.", "etapa": "asignacion", "obligatorio": True, "sistema": True},
    {"nombre": "Carta de Asignacion", "descripcion": "Documento que confirma la asignacion del alumno a una unidad receptora.", "instrucciones": "Documento enviado por coordinacion una vez autorizada la asignacion.", "etapa": "asignacion", "obligatorio": True, "sistema": True},
    {"nombre": "Carta de Colaboracion Firmada", "descripcion": "Sube la carta de colaboracion ya firmada y completamente llenada.", "instrucciones": "Formato permitido: PDF. El documento debe ser claro, legible y estar completo.", "etapa": "asignacion_firmada", "obligatorio": True, "sistema": False},
    {"nombre": "Carta de Presentacion Firmada", "descripcion": "Sube la carta de presentacion ya firmada por las partes correspondientes.", "instrucciones": "Formato permitido: PDF. El documento debe ser claro, legible y estar completo.", "etapa": "asignacion_firmada", "obligatorio": True, "sistema": False},
    {"nombre": "Carta de Asignacion Firmada", "descripcion": "Sube la carta de asignacion ya firmada para continuar con el proceso.", "instrucciones": "Formato permitido: PDF. El documento debe ser claro, legible y estar completo.", "etapa": "asignacion_firmada", "obligatorio": True, "sistema": False},
]

ORDEN_DOCUMENTOS = {doc["nombre"]: index for index, doc in enumerate(DOCUMENTOS_FLUJO)}


def _convocatoria_vigente(db: Session) -> ConvocatoriaModel:
    convocatoria = (
        db.query(ConvocatoriaModel)
        .filter(ConvocatoriaModel.estado == "Activa")
        .order_by(ConvocatoriaModel.fecha_inicio.desc())
        .first()
    )
    if convocatoria:
        return convocatoria
    convocatoria = db.query(ConvocatoriaModel).order_by(ConvocatoriaModel.fecha_inicio.desc()).first()
    if convocatoria is None:
        raise HTTPException(status_code=400, detail="No hay convocatoria registrada")
    return convocatoria


def generar_nomenclatura(nombre_documento: str, matricula: str) -> str:
    nombre = nombre_documento.lower()
    for origen, destino in {" ": "_", "á": "a", "é": "e", "í": "i", "ó": "o", "ú": "u", "ñ": "n"}.items():
        nombre = nombre.replace(origen, destino)
    return f"{nombre}_{matricula}.pdf"


def obtener_definicion(nombre: str) -> dict | None:
    return next((doc for doc in DOCUMENTOS_FLUJO if doc["nombre"] == nombre), None)


def obtener_o_crear_tipo(db: Session, definicion: dict) -> TipoDocumentoModel:
    tipo = (
        db.query(TipoDocumentoModel)
        .filter(
            TipoDocumentoModel.nombre_documento == definicion["nombre"],
            TipoDocumentoModel.etapa == definicion["etapa"],
        )
        .first()
    )
    if tipo is None:
        tipo = TipoDocumentoModel(
            nombre_documento=definicion["nombre"],
            etapa=definicion["etapa"],
            obligatorio=definicion["obligatorio"],
        )
        db.add(tipo)
        db.flush()
    tipo.descripcion = definicion["descripcion"]
    tipo.etapa = definicion["etapa"]
    tipo.obligatorio = definicion["obligatorio"]
    return tipo


def obtener_o_crear_expediente(db: Session, alumno: AlumnoModel) -> ExpedienteModel:
    convocatoria = _convocatoria_vigente(db)
    expediente = (
        db.query(ExpedienteModel)
        .filter(
            ExpedienteModel.id_alumno == alumno.id_alumno,
            ExpedienteModel.id_convocatoria == convocatoria.id_convocatoria,
        )
        .first()
    )
    if expediente:
        return expediente
    expediente = ExpedienteModel(
        id_alumno=alumno.id_alumno,
        id_convocatoria=convocatoria.id_convocatoria,
        estado_expediente="Pendiente",
    )
    db.add(expediente)
    db.flush()
    return expediente


def asegurar_documentos_expediente(db: Session, alumno: AlumnoModel) -> ExpedienteModel:
    expediente = obtener_o_crear_expediente(db, alumno)
    for definicion in DOCUMENTOS_FLUJO:
        tipo = obtener_o_crear_tipo(db, definicion)
        documento = (
            db.query(DocumentoModel)
            .filter(
                DocumentoModel.id_expediente == expediente.id_expediente,
                DocumentoModel.id_tipo_documento == tipo.id_tipo_documento,
            )
            .first()
        )
        if documento is None:
            db.add(
                DocumentoModel(
                    id_expediente=expediente.id_expediente,
                    id_tipo_documento=tipo.id_tipo_documento,
                    nombre_archivo="",
                    ruta_archivo="",
                    estado_documento="Pendiente",
                    generado_por_sistema=definicion["sistema"],
                )
            )
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


def calcular_flujo(filas) -> tuple[bool, bool, bool, bool, bool]:
    iniciales = [(d, t) for d, t in filas if t.etapa in ["elegibilidad", "expediente"]]
    seleccion = [(d, t) for d, t in filas if t.etapa == "seleccion_empresa"]
    asignacion = [(d, t) for d, t in filas if t.etapa == "asignacion"]

    elegibilidad = [(d, t) for d, t in filas if t.etapa == "elegibilidad"]
    elegibilidad_aprobada = bool(elegibilidad) and all(d.estado_documento == "Aprobado" for d, _ in elegibilidad)
    expediente_inicial_aprobado = bool(iniciales) and all(d.estado_documento == "Aprobado" for d, _ in iniciales)
    seleccion_habilitada = expediente_inicial_aprobado
    seleccion_validada = bool(seleccion) and all(d.estado_documento == "Aprobado" for d, _ in seleccion)
    asignacion_habilitada = bool(asignacion) and any(d.nombre_archivo for d, _ in asignacion)
    return elegibilidad_aprobada, expediente_inicial_aprobado, seleccion_habilitada, seleccion_validada, asignacion_habilitada


def _nombre_completo(usuario: UsuarioModel | None) -> str:
    if usuario is None:
        return "Alumno"
    return " ".join(parte for parte in [usuario.nombre, usuario.apellido_paterno, usuario.apellido_materno] if parte)


def serializar_documentacion(db: Session, alumno: AlumnoModel) -> dict:
    expediente = asegurar_documentos_expediente(db, alumno)
    usuario = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == alumno.id_usuario).first()
    carrera = db.query(CarreraModel).filter(CarreraModel.id_carrera == alumno.id_carrera).first()
    filas = documentos_del_flujo(db, expediente)
    elegibilidad_aprobada, expediente_inicial_aprobado, seleccion_habilitada, seleccion_validada, asignacion_habilitada = calcular_flujo(filas)

    documentos = []
    for documento, tipo in filas:
        definicion = obtener_definicion(tipo.nombre_documento) or {}
        habilitado = False
        if tipo.etapa == "elegibilidad":
            habilitado = True
        elif tipo.etapa == "expediente":
            habilitado = elegibilidad_aprobada
        elif tipo.etapa == "seleccion_empresa":
            habilitado = seleccion_habilitada
        elif tipo.etapa in {"asignacion", "asignacion_firmada"}:
            habilitado = asignacion_habilitada

        codigo_generacion = codigo_generacion_por_nombre(tipo.nombre_documento)
        documentos.append(
            {
                "id_documento": documento.id_documento,
                "id_tipo_documento": tipo.id_tipo_documento,
                "nombre": tipo.nombre_documento,
                "descripcion": tipo.descripcion,
                "instrucciones": definicion.get("instrucciones"),
                "etapa": tipo.etapa,
                "obligatorio": bool(tipo.obligatorio),
                "nombre_archivo": documento.nombre_archivo or None,
                "ruta_archivo": documento.ruta_archivo or None,
                "estado": documento.estado_documento,
                "fecha_carga": documento.fecha_carga.isoformat() if documento.fecha_carga else None,
                "generado_por_sistema": bool(documento.generado_por_sistema),
                "codigo_generacion": codigo_generacion,
                "puede_descargar_generado": bool(codigo_generacion and habilitado),
                "habilitado": habilitado,
                "nomenclatura": generar_nomenclatura(tipo.nombre_documento or "documento", alumno.matricula),
                "url_archivo": f"/alumno/documentos/{documento.id_documento}/archivo" if documento.ruta_archivo else None,
            }
        )

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
        "resumen": {
            "aprobados": aprobados,
            "revision": revision,
            "observados": observados,
            "pendientes": pendientes,
            "total": len(documentos),
        },
        "documentos": documentos,
    }


def resumen_documentos(documentos: list[DocumentoModel]) -> dict:
    return {
        "aprobados": sum(1 for d in documentos if d.estado_documento == "Aprobado"),
        "cargados": sum(1 for d in documentos if d.nombre_archivo),
        "revision": sum(1 for d in documentos if d.nombre_archivo and d.estado_documento == "Pendiente"),
        "observados": sum(1 for d in documentos if d.estado_documento in ["Observado", "Rechazado"]),
        "total": len(documentos),
    }


def listar_alumnos_revision(db: Session) -> list[dict]:
    alumnos = db.query(AlumnoModel).order_by(AlumnoModel.id_alumno).all()
    resultado = []
    for alumno in alumnos:
        expediente = asegurar_documentos_expediente(db, alumno)
        usuario = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == alumno.id_usuario).first()
        carrera = db.query(CarreraModel).filter(CarreraModel.id_carrera == alumno.id_carrera).first()
        filas = documentos_del_flujo(db, expediente)
        documentos = [documento for documento, _ in filas]
        resultado.append(
            {
                "id_alumno": alumno.id_alumno,
                "id_expediente": expediente.id_expediente,
                "nombre": _nombre_completo(usuario),
                "correo": usuario.correo if usuario else None,
                "matricula": alumno.matricula,
                "semestre": alumno.semestre,
                "grupo": alumno.grupo,
                "carrera": carrera.nombre if carrera else None,
                "estado_alumno": alumno.estado_alumno,
                "estado_expediente": expediente.estado_expediente,
                "resumen": resumen_documentos(documentos),
            }
        )
    return resultado


def crear_pdf_placeholder(ruta: Path, titulo: str, alumno: AlumnoModel) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    texto = f"{titulo} - {alumno.matricula}".replace("(", "").replace(")", "")
    contenido = f"%PDF-1.4\n1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj\n2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj\n3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj\n4 0 obj << /Length 80 >> stream\nBT /F1 18 Tf 72 720 Td ({texto}) Tj ET\nendstream endobj\n5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj\nxref\n0 6\n0000000000 65535 f \ntrailer << /Root 1 0 R /Size 6 >>\nstartxref\n0\n%%EOF\n"
    ruta.write_bytes(contenido.encode("latin-1", errors="ignore"))


def subir_archivo_alumno(db: Session, alumno: AlumnoModel, id_documento: int, archivo: UploadFile) -> dict:
    documentacion = serializar_documentacion(db, alumno)
    info_documento = {d["id_documento"]: d for d in documentacion["documentos"]}.get(id_documento)
    if info_documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    if not info_documento["habilitado"] or info_documento["generado_por_sistema"]:
        raise HTTPException(status_code=403, detail="Este documento aun no esta habilitado para carga")
    if info_documento["estado"] == "Aprobado":
        raise HTTPException(status_code=400, detail="El documento ya fue aprobado y no puede reemplazarse")
    if not archivo.filename or not archivo.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Solo se permiten archivos PDF")

    documento = db.query(DocumentoModel).filter(DocumentoModel.id_documento == id_documento).first()
    if documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
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


def habilitar_documentacion_asignacion(db: Session, alumno: AlumnoModel) -> dict:
    detalle = serializar_documentacion(db, alumno)
    if not detalle["expediente"]["seleccion_validada"]:
        raise HTTPException(status_code=400, detail="Primero debe aprobarse la seleccion de empresa")

    expediente = asegurar_documentos_expediente(db, alumno)
    filas = documentos_del_flujo(db, expediente)
    carpeta = UPLOAD_DIR / str(expediente.id_expediente)
    for documento, tipo in filas:
        if tipo.etapa != "asignacion":
            continue
        nombre_archivo = generar_nomenclatura(tipo.nombre_documento, alumno.matricula)
        destino = carpeta / f"{documento.id_documento}_{nombre_archivo}"
        crear_pdf_placeholder(destino, tipo.nombre_documento, alumno)
        documento.nombre_archivo = nombre_archivo
        documento.ruta_archivo = str(destino)
        documento.estado_documento = "Aprobado"
        documento.generado_por_sistema = True
        documento.fecha_carga = datetime.now()
    alumno.estado_alumno = "Asignado"
    expediente.estado_expediente = "Aprobado"
    db.commit()
    return serializar_documentacion(db, alumno)
