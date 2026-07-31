from __future__ import annotations

from datetime import date, datetime
from pathlib import Path
import re
import unicodedata

from fastapi import HTTPException, UploadFile
from sqlalchemy.orm import Session

from app.services.convocatoria_rules_service import (
    obtener_convocatorias_disponibles_para_alumno,
    validar_etapa_actual,
)
from app.services.documentacion_generada_service import codigo_generacion_por_nombre
from app.services.upload_security import leer_uploadfile_validado_documento, normalizar_nombre_archivo
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel
from infrastructure.persistence.models.carrera import CarreraModel
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel
from infrastructure.persistence.models.documento import DocumentoModel
from infrastructure.persistence.models.expediente import ExpedienteModel
from infrastructure.persistence.models.observacion import ObservacionModel
from infrastructure.persistence.models.tipo_documento import TipoDocumentoModel
from infrastructure.persistence.models.usuario import UsuarioModel


UPLOAD_DIR = Path(__file__).resolve().parents[2] / "uploads" / "expedientes"

DOCUMENTOS_FLUJO = [
    {"nombre": "Historial academico (Comprobante con materias)", "descripcion": "Historial academico del alumno con las materias cursadas.", "instrucciones": "Solicitar en SYSWEB el Historial academico (Comprobante con materias). El documento debe ser claro, legible, estar completo y no contener sombras, reflejos, recortes o paginas borrosas.", "etapa": "Elegibilidad", "obligatorio": True, "sistema": False},
    {"nombre": "Constancia de Vigencia de Derechos", "descripcion": "Constancia que acredita que el alumno cuenta con vigencia de derechos para continuar el tramite.", "instrucciones": "Descargar la Constancia de Vigencia de Derechos en el portal del IMSS. El documento debe ser claro, legible, estar completo y no contener sombras, reflejos, recortes o paginas borrosas.", "etapa": "Elegibilidad", "obligatorio": True, "sistema": False},
    {"nombre": "Carta Compromiso", "descripcion": "Documento oficial generado por el sistema. Descargalo, imprime, firma y sube el PDF firmado.", "instrucciones": "Descarga el documento oficial, imprime, completa los espacios pendientes, firma y vuelve a subirlo en formato PDF.", "etapa": "Expediente", "obligatorio": True, "sistema": False},
    {"nombre": "Carta de Exoneracion", "descripcion": "Documento oficial generado por el sistema. Descargalo, completa los datos manuales, firma y sube el PDF firmado.", "instrucciones": "Completa a mano los datos de contacto de emergencia y tutor antes de firmar. Sube el documento firmado en formato PDF.", "etapa": "Expediente", "obligatorio": True, "sistema": False},
    {"nombre": "Solicitud FO-136", "descripcion": "Solicitud oficial de inscripcion. Descargala, imprime, completa los campos manuales, firma y sube el PDF firmado.", "instrucciones": "La fotografia, datos personales pendientes y firmas deben completarse despues de imprimir. Sube el documento firmado en formato PDF.", "etapa": "Expediente", "obligatorio": True, "sistema": False},
    {"nombre": "Credencial del Alumno", "descripcion": "Copia digital de la credencial vigente del alumno.", "instrucciones": "Sube la credencial vigente del alumno en formato PDF. Debe verse completa, clara y sin recortes importantes.", "etapa": "Expediente", "obligatorio": True, "sistema": False},
    {"nombre": "Credencial del Tutor", "descripcion": "Copia digital de la credencial del padre, madre o tutor.", "instrucciones": "Sube la credencial del tutor en formato PDF. Debe ser clara, legible y corresponder al tutor firmante.", "etapa": "Expediente", "obligatorio": True, "sistema": False},
    {"nombre": "Carta de Exposicion de Motivos", "descripcion": "Documento generado despues de que el alumno selecciona sus opciones de empresa.", "instrucciones": "El alumno debe descargarlo, firmarlo, escanearlo y subirlo nuevamente.", "etapa": "SeleccionEmpresa", "obligatorio": True, "sistema": False},
    {"nombre": "Carta de Colaboracion", "descripcion": "Documento emitido por coordinacion para formalizar la colaboracion entre la institucion y la unidad receptora.", "instrucciones": "Documento enviado por coordinacion cuando el expediente y seleccion estan validados.", "etapa": "Asignacion", "obligatorio": True, "sistema": True},
    {"nombre": "Carta de Presentacion", "descripcion": "Documento oficial emitido por la institucion para presentar al alumno ante la unidad receptora.", "instrucciones": "Documento enviado por coordinacion despues de aprobar la seleccion de empresa.", "etapa": "Asignacion", "obligatorio": True, "sistema": True},
    {"nombre": "Carta de Asignacion", "descripcion": "Documento que confirma la asignacion del alumno a una unidad receptora.", "instrucciones": "Documento enviado por coordinacion una vez autorizada la asignacion.", "etapa": "Asignacion", "obligatorio": True, "sistema": True},
    {"nombre": "Carta de Colaboracion Firmada", "descripcion": "Sube la carta de colaboracion ya firmada y completamente llenada.", "instrucciones": "Formato permitido: PDF. El documento debe ser claro, legible y estar completo.", "etapa": "AsignacionFirmada", "obligatorio": True, "sistema": False},
    {"nombre": "Carta de Presentacion Firmada", "descripcion": "Sube la carta de presentacion ya firmada por las partes correspondientes.", "instrucciones": "Formato permitido: PDF. El documento debe ser claro, legible y estar completo.", "etapa": "AsignacionFirmada", "obligatorio": True, "sistema": False},
    {"nombre": "Carta de Asignacion Firmada", "descripcion": "Sube la carta de asignacion ya firmada para continuar con el proceso.", "instrucciones": "Formato permitido: PDF. El documento debe ser claro, legible y estar completo.", "etapa": "AsignacionFirmada", "obligatorio": True, "sistema": False},
]

ORDEN_DOCUMENTOS = {doc["nombre"]: index for index, doc in enumerate(DOCUMENTOS_FLUJO)}
ETAPAS_DB = {
    "elegibilidad": "Elegibilidad",
    "expediente": "Expediente",
    "seleccion_empresa": "SeleccionEmpresa",
    "asignacion": "Asignacion",
    "asignacion_firmada": "AsignacionFirmada",
    "liberacion": "Liberacion",
    "Elegibilidad": "Elegibilidad",
    "Expediente": "Expediente",
    "SeleccionEmpresa": "SeleccionEmpresa",
    "Asignacion": "Asignacion",
    "AsignacionFirmada": "AsignacionFirmada",
    "Liberacion": "Liberacion",
}
ETAPAS_UI = {
    "Elegibilidad": "elegibilidad",
    "Expediente": "expediente",
    "SeleccionEmpresa": "seleccion_empresa",
    "Asignacion": "asignacion",
    "AsignacionFirmada": "asignacion_firmada",
    "Liberacion": "liberacion",
}


def _etapa_db(etapa: str) -> str:
    return ETAPAS_DB.get(etapa, etapa)


def _etapa_ui(etapa: str) -> str:
    return ETAPAS_UI.get(etapa, etapa)


def _convocatorias_disponibles(db: Session, alumno: AlumnoModel) -> list[ConvocatoriaModel]:
    return obtener_convocatorias_disponibles_para_alumno(db, alumno)


def listar_convocatorias_disponibles_alumno(db: Session, alumno: AlumnoModel) -> list[dict]:
    return [_convocatoria_response(convocatoria) for convocatoria in _convocatorias_disponibles(db, alumno)]


def _estado_inscripcion_convocatoria(convocatoria: ConvocatoriaModel) -> tuple[bool, str | None]:
    inicio = convocatoria.fecha_inicio_documentos
    cierre = convocatoria.fecha_cierre_documentos
    hoy = date.today()
    if inicio is None or cierre is None:
        return False, "La convocatoria todavía no tiene fechas de inscripción configuradas."
    if hoy < inicio:
        return False, f"La inscripción abre el {inicio.strftime('%d/%m/%Y')}."
    if hoy > cierre:
        return False, f"La inscripción cerró el {cierre.strftime('%d/%m/%Y')}."
    return True, "Inscripción disponible."


def _convocatoria_response(convocatoria: ConvocatoriaModel) -> dict:
    puede_inscribirse, mensaje_inscripcion = _estado_inscripcion_convocatoria(convocatoria)
    return {
        "id_convocatoria": convocatoria.id_convocatoria,
        "nombre": convocatoria.nombre,
        "tipo_periodo": convocatoria.tipo_periodo,
        "estado": convocatoria.estado,
        "puede_inscribirse": puede_inscribirse,
        "mensaje_inscripcion": mensaje_inscripcion,
        "fecha_inicio_documentos": convocatoria.fecha_inicio_documentos.isoformat() if convocatoria.fecha_inicio_documentos else None,
        "fecha_cierre_documentos": convocatoria.fecha_cierre_documentos.isoformat() if convocatoria.fecha_cierre_documentos else None,
        "fecha_inicio_validacion": convocatoria.fecha_inicio_validacion.isoformat() if convocatoria.fecha_inicio_validacion else None,
        "fecha_cierre_validacion": convocatoria.fecha_cierre_validacion.isoformat() if convocatoria.fecha_cierre_validacion else None,
        "fecha_inicio_seleccion": convocatoria.fecha_inicio_seleccion.isoformat() if convocatoria.fecha_inicio_seleccion else None,
        "fecha_cierre_seleccion": convocatoria.fecha_cierre_seleccion.isoformat() if convocatoria.fecha_cierre_seleccion else None,
        "fecha_inicio_asignacion": convocatoria.fecha_inicio_asignacion.isoformat() if convocatoria.fecha_inicio_asignacion else None,
        "fecha_cierre_asignacion": convocatoria.fecha_cierre_asignacion.isoformat() if convocatoria.fecha_cierre_asignacion else None,
        "fecha_inicio_practicas": convocatoria.fecha_inicio_practicas.isoformat() if convocatoria.fecha_inicio_practicas else None,
        "fecha_cierre_practicas": convocatoria.fecha_cierre_practicas.isoformat() if convocatoria.fecha_cierre_practicas else None,
        "fecha_inicio_cierre": convocatoria.fecha_inicio_cierre.isoformat() if convocatoria.fecha_inicio_cierre else None,
        "fecha_cierre_cierre": convocatoria.fecha_cierre_cierre.isoformat() if convocatoria.fecha_cierre_cierre else None,
    }


def _expediente_actual(db: Session, alumno: AlumnoModel) -> ExpedienteModel | None:
    return (
        db.query(ExpedienteModel)
        .join(ConvocatoriaModel, ConvocatoriaModel.id_convocatoria == ExpedienteModel.id_convocatoria)
        .filter(
            ExpedienteModel.id_alumno == alumno.id_alumno,
            ConvocatoriaModel.estado == "Activa",
            ConvocatoriaModel.tipo_periodo == alumno.periodo_practica,
            ExpedienteModel.estado_expediente.in_(["Pendiente", "En Revisión", "Aprobado"]),
        )
        .order_by(ConvocatoriaModel.fecha_inicio_general.desc(), ExpedienteModel.fecha_creacion.desc())
        .first()
    )


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
            TipoDocumentoModel.etapa == _etapa_db(definicion["etapa"]),
        )
        .first()
    )
    if tipo is None:
        tipo = TipoDocumentoModel(
            nombre_documento=definicion["nombre"],
            etapa=_etapa_db(definicion["etapa"]),
            obligatorio=definicion["obligatorio"],
        )
        db.add(tipo)
        db.flush()
    tipo.descripcion = definicion["descripcion"]
    tipo.etapa = _etapa_db(definicion["etapa"])
    tipo.obligatorio = definicion["obligatorio"]
    return tipo


def _asegurar_documentos_en_expediente(db: Session, expediente: ExpedienteModel) -> None:
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


def inscribir_alumno_convocatoria(db: Session, alumno: AlumnoModel, id_convocatoria: int) -> dict:
    convocatoria = (
        db.query(ConvocatoriaModel)
        .filter(
            ConvocatoriaModel.id_convocatoria == id_convocatoria,
            ConvocatoriaModel.estado == "Activa",
            ConvocatoriaModel.tipo_periodo == alumno.periodo_practica,
        )
        .first()
    )
    if convocatoria is None:
        raise HTTPException(status_code=404, detail="Convocatoria disponible no encontrada.")
    validar_etapa_actual(convocatoria, "documentos")

    expediente_activo = _expediente_actual(db, alumno)
    if expediente_activo is not None and expediente_activo.id_convocatoria != id_convocatoria:
        raise HTTPException(status_code=409, detail="Ya tienes una inscripcion activa en otra convocatoria.")

    expediente = (
        db.query(ExpedienteModel)
        .filter(
            ExpedienteModel.id_alumno == alumno.id_alumno,
            ExpedienteModel.id_convocatoria == convocatoria.id_convocatoria,
        )
        .first()
    )
    if expediente is None:
        expediente = ExpedienteModel(
            id_alumno=alumno.id_alumno,
            id_convocatoria=convocatoria.id_convocatoria,
            estado_expediente="Pendiente",
        )
        db.add(expediente)
        db.flush()
    _asegurar_documentos_en_expediente(db, expediente)
    db.commit()
    db.refresh(expediente)
    return serializar_documentacion(db, alumno)


def obtener_expediente_actual(db: Session, alumno: AlumnoModel) -> ExpedienteModel:
    expediente = _expediente_actual(db, alumno)
    if expediente is None:
        raise HTTPException(status_code=409, detail="Necesitas inscribirte a una convocatoria antes de cargar documentacion.")
    validar_etapa_actual(expediente.convocatoria, "documentos")
    return expediente


def asegurar_documentos_expediente(db: Session, alumno: AlumnoModel) -> ExpedienteModel:
    expediente = obtener_expediente_actual(db, alumno)
    _asegurar_documentos_en_expediente(db, expediente)
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
    iniciales = [(d, t) for d, t in filas if t.etapa in ["Elegibilidad", "Expediente"]]
    seleccion = [(d, t) for d, t in filas if t.etapa == "SeleccionEmpresa"]
    asignacion = [(d, t) for d, t in filas if t.etapa == "Asignacion"]

    elegibilidad = [(d, t) for d, t in filas if t.etapa == "Elegibilidad"]
    elegibilidad_aprobada = bool(elegibilidad) and all(d.estado_documento == "Aprobado" for d, _ in elegibilidad)
    expediente_inicial_aprobado = bool(iniciales) and all(d.estado_documento == "Aprobado" for d, _ in iniciales)
    seleccion_habilitada = expediente_inicial_aprobado
    seleccion_validada = bool(seleccion) and all(d.estado_documento == "Aprobado" for d, _ in seleccion)
    asignacion_habilitada = bool(asignacion) and any(d.nombre_archivo for d, _ in asignacion)
    return elegibilidad_aprobada, expediente_inicial_aprobado, seleccion_habilitada, seleccion_validada, asignacion_habilitada


def _nombre_completo(alumno: AlumnoModel | None) -> str:
    if alumno is None:
        return "Alumno"
    return " ".join(parte for parte in [alumno.nombre, alumno.apellido_paterno, alumno.apellido_materno] if parte) or "Alumno"


def _slug_carpeta(valor: str | None, fallback: str) -> str:
    texto = valor or fallback
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    texto = re.sub(r"[^A-Za-z0-9]+", "_", texto).strip("_").lower()
    return texto or fallback


def _carpeta_documento_alumno(alumno: AlumnoModel, expediente: ExpedienteModel, bloque: str) -> Path:
    nombre_alumno = "_".join(
        parte for parte in [alumno.nombre, alumno.apellido_paterno, alumno.apellido_materno, alumno.matricula] if parte
    )
    tipo_practica = alumno.tipo_practica.nombre if alumno.tipo_practica else "practica"
    return (
        UPLOAD_DIR
        / "alumnos"
        / _slug_carpeta(nombre_alumno, f"alumno_{alumno.id_alumno}")
        / _slug_carpeta(tipo_practica, "practica")
        / f"convocatoria_{expediente.id_convocatoria}"
        / _slug_carpeta(bloque, "documentos")
    )


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
        if tipo.etapa == "Elegibilidad":
            habilitado = True
        elif tipo.etapa == "Expediente":
            habilitado = elegibilidad_aprobada
        elif tipo.etapa == "SeleccionEmpresa":
            habilitado = seleccion_habilitada
        elif tipo.etapa in {"Asignacion", "AsignacionFirmada"}:
            habilitado = asignacion_habilitada

        codigo_generacion = codigo_generacion_por_nombre(tipo.nombre_documento)
        observaciones = _observaciones_documento(documento)
        documentos.append(
            {
                "id_documento": documento.id_documento,
                "id_tipo_documento": tipo.id_tipo_documento,
                "nombre": tipo.nombre_documento,
                "descripcion": tipo.descripcion,
                "instrucciones": definicion.get("instrucciones"),
                "etapa": _etapa_ui(tipo.etapa),
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
                "url_archivo": f"/alumno/documentos/documentos/{documento.id_documento}/archivo" if documento.ruta_archivo else None,
                "observaciones": observaciones,
                "ultima_observacion": observaciones[0] if observaciones else None,
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
            "nombre": alumno.nombre,
            "apellido_paterno": alumno.apellido_paterno,
            "apellido_materno": alumno.apellido_materno,
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
        "convocatoria": _convocatoria_response(expediente.convocatoria),
        "resumen": {
            "aprobados": aprobados,
            "revisión": revision,
            "observados": observados,
            "pendientes": pendientes,
            "total": len(documentos),
        },
        "documentos": documentos,
    }


def _nombre_usuario_observacion(usuario: UsuarioModel | None) -> str:
    if usuario is None:
        return "Sin usuario"
    perfil = usuario.personal_interno or usuario.alumno or usuario.responsable_empresa
    nombre = " ".join(
        parte
        for parte in [
            getattr(perfil, "nombre", None),
            getattr(perfil, "apellido_paterno", None),
            getattr(perfil, "apellido_materno", None),
        ]
        if parte
    )
    return nombre or usuario.correo or "Sin usuario"


def _observaciones_documento(documento: DocumentoModel) -> list[dict]:
    observaciones = sorted(
        getattr(documento, "observaciones_relacionadas", []) or [],
        key=lambda item: item.fecha_observacion,
        reverse=True,
    )
    return [
        {
            "id_observacion": observacion.id_observacion,
            "id_usuario": observacion.id_usuario,
            "usuario": _nombre_usuario_observacion(observacion.usuario),
            "descripcion": observacion.descripcion,
            "tipo_observacion": observacion.tipo_observacion,
            "fecha_observacion": observacion.fecha_observacion.isoformat() if observacion.fecha_observacion else None,
        }
        for observacion in observaciones
    ]


def resumen_documentos(documentos: list[DocumentoModel]) -> dict:
    return {
        "aprobados": sum(1 for d in documentos if d.estado_documento == "Aprobado"),
        "cargados": sum(1 for d in documentos if d.nombre_archivo),
        "revisión": sum(1 for d in documentos if d.nombre_archivo and d.estado_documento == "Pendiente"),
        "observados": sum(1 for d in documentos if d.estado_documento in ["Observado", "Rechazado"]),
        "total": len(documentos),
    }


def listar_alumnos_revision(db: Session) -> list[dict]:
    alumnos = db.query(AlumnoModel).order_by(AlumnoModel.id_alumno).all()
    resultado = []
    for alumno in alumnos:
        try:
            expediente = asegurar_documentos_expediente(db, alumno)
        except HTTPException as exc:
            if exc.status_code == 409:
                continue
            raise
        usuario = db.query(UsuarioModel).filter(UsuarioModel.id_usuario == alumno.id_usuario).first()
        carrera = db.query(CarreraModel).filter(CarreraModel.id_carrera == alumno.id_carrera).first()
        filas = documentos_del_flujo(db, expediente)
        documentos = [documento for documento, _ in filas]
        documentos_en_revision = [
            documento
            for documento in documentos
            if documento.nombre_archivo
            and documento.estado_documento == "Pendiente"
            and not documento.generado_por_sistema
        ]
        fecha_envio_pendiente = min(
            (documento.fecha_carga for documento in documentos_en_revision if documento.fecha_carga),
            default=None,
        )
        resumen = resumen_documentos(documentos)
        resultado.append(
            {
                "id_alumno": alumno.id_alumno,
                "id_expediente": expediente.id_expediente,
                "nombre": _nombre_completo(alumno),
                "correo": usuario.correo if usuario else None,
                "matricula": alumno.matricula,
                "semestre": alumno.semestre,
                "grupo": alumno.grupo,
                "carrera": carrera.nombre if carrera else None,
                "estado_alumno": alumno.estado_alumno,
                "estado_expediente": expediente.estado_expediente,
                "fecha_envio_pendiente": (
                    fecha_envio_pendiente.isoformat()
                    if fecha_envio_pendiente is not None
                    else None
                ),
                "_fecha_orden_revision": fecha_envio_pendiente,
                "resumen": resumen,
            }
        )

    resultado.sort(
        key=lambda item: (
            0 if item["resumen"]["revisión"] > 0 else 1,
            item["_fecha_orden_revision"] or datetime.max,
            item["nombre"].casefold(),
        )
    )
    for item in resultado:
        item.pop("_fecha_orden_revision", None)
    return resultado


def _asignacion_activa_alumno(db: Session, alumno: AlumnoModel) -> AsignacionModel | None:
    return (
        db.query(AsignacionModel)
        .filter(
            AsignacionModel.id_alumno == alumno.id_alumno,
            AsignacionModel.estado_asignacion == "Activa",
        )
        .order_by(AsignacionModel.fecha_asignacion.desc())
        .first()
    )


def crear_pdf_placeholder(
    ruta: Path,
    titulo: str,
    alumno: AlumnoModel,
    asignacion: AsignacionModel | None = None,
) -> None:
    ruta.parent.mkdir(parents=True, exist_ok=True)
    empresa = asignacion.empresa.nombre_empresa if asignacion and asignacion.empresa else "Sin empresa"
    vacante = asignacion.vacante.titulo if asignacion and asignacion.vacante else "Sin vacante"
    texto = f"{titulo} - {alumno.matricula} - {empresa} - {vacante}".replace("(", "").replace(")", "")
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
    contenido = leer_uploadfile_validado_documento(archivo)
    normalizar_nombre_archivo(archivo.filename, "documento.pdf")

    documento = db.query(DocumentoModel).filter(DocumentoModel.id_documento == id_documento).first()
    if documento is None:
        raise HTTPException(status_code=404, detail="Documento no encontrado")
    expediente = db.query(ExpedienteModel).filter(ExpedienteModel.id_expediente == documento.id_expediente).first()
    if expediente is None:
        raise HTTPException(status_code=404, detail="Expediente no encontrado")
    validar_etapa_actual(expediente.convocatoria, "documentos")
    carpeta = _carpeta_documento_alumno(alumno, expediente, info_documento.get("etapa") or "documentos")
    carpeta.mkdir(parents=True, exist_ok=True)
    extension = Path(archivo.filename or "documento.pdf").suffix.lower()
    nombre_base = Path(generar_nomenclatura(info_documento["nombre"], alumno.matricula)).stem
    nombre_archivo = f"{nombre_base}{extension}"
    destino = carpeta / f"{id_documento}_{nombre_archivo}"
    destino.write_bytes(contenido)

    documento.nombre_archivo = nombre_archivo
    documento.ruta_archivo = str(destino)
    documento.estado_documento = "Pendiente"
    documento.fecha_carga = datetime.now()
    expediente.estado_expediente = "En Revisión"
    db.commit()
    return serializar_documentacion(db, alumno)


def habilitar_documentacion_asignacion(db: Session, alumno: AlumnoModel) -> dict:
    detalle = serializar_documentacion(db, alumno)
    if not detalle["expediente"]["seleccion_validada"]:
        raise HTTPException(status_code=400, detail="Primero debe aprobarse la seleccion de empresa")

    expediente = asegurar_documentos_expediente(db, alumno)
    filas = documentos_del_flujo(db, expediente)
    carpeta = _carpeta_documento_alumno(alumno, expediente, "generados") / "asignacion"
    asignacion = _asignacion_activa_alumno(db, alumno)
    for documento, tipo in filas:
        if tipo.etapa != "Asignacion":
            continue
        nombre_archivo = generar_nomenclatura(tipo.nombre_documento, alumno.matricula)
        destino = carpeta / f"{documento.id_documento}_{nombre_archivo}"
        crear_pdf_placeholder(destino, tipo.nombre_documento, alumno, asignacion)
        documento.nombre_archivo = nombre_archivo
        documento.ruta_archivo = str(destino)
        documento.estado_documento = "Aprobado"
        documento.generado_por_sistema = True
        documento.fecha_carga = datetime.now()
    # DB limpia no tiene estado_alumno="asignado"; la asignacion se refleja en asignacion.estado_asignacion.
    expediente.estado_expediente = "Aprobado"
    db.commit()
    return serializar_documentacion(db, alumno)
