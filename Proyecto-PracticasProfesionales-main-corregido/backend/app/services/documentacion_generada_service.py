from __future__ import annotations

import shutil
import subprocess
import re
import unicodedata
from datetime import date
from pathlib import Path
from tempfile import TemporaryDirectory
from zipfile import ZIP_DEFLATED, ZipFile
from xml.sax.saxutils import escape

from fastapi import HTTPException
from sqlalchemy.orm import object_session

from infrastructure.database.connection import SessionLocal
from infrastructure.persistence.models.alumno import AlumnoModel
from infrastructure.persistence.models.asignacion import AsignacionModel  # noqa: F401
from infrastructure.persistence.models.carrera import CarreraModel  # noqa: F401
from infrastructure.persistence.models.convocatoria import ConvocatoriaModel  # noqa: F401
from infrastructure.persistence.models.configuracion_sistema import ConfiguracionSistemaModel
from infrastructure.persistence.models.documento import DocumentoModel  # noqa: F401
from infrastructure.persistence.models.empresa import EmpresaModel  # noqa: F401
from infrastructure.persistence.models.expediente import ExpedienteModel  # noqa: F401
from infrastructure.persistence.models.horas import HorasModel  # noqa: F401
from infrastructure.persistence.models.rol import RolModel  # noqa: F401
from infrastructure.persistence.models.seleccion_empresa import SeleccionEmpresaModel  # noqa: F401
from infrastructure.persistence.models.tipo_practica import TipoPracticaModel  # noqa: F401
from infrastructure.persistence.models.usuario import UsuarioModel  # noqa: F401
from infrastructure.persistence.models.vacante import VacanteModel  # noqa: F401


BASE_DIR = Path(__file__).resolve().parents[2]
TEMPLATES_DIR = BASE_DIR / "templates" / "documentos"
CACHE_VERSION = "relleno-v3-configuracion-responsables"

DOCUMENTOS_GENERADOS = {
    "carta_compromiso": {
        "template": "carta_compromiso.docx",
        "filename": "carta_compromiso_{matricula}.pdf",
        "fallback_filename": "carta_compromiso_{matricula}.docx",
        "tipo": "Carta Compromiso",
    },
    "carta_exoneracion": {
        "template": "carta_exoneracion.docx",
        "filename": "carta_exoneracion_{matricula}.pdf",
        "fallback_filename": "carta_exoneracion_{matricula}.docx",
        "tipo": "Carta de Exoneracion",
    },
    "solicitud_fo_136": {
        "template": "solicitud_fo_136.docx",
        "filename": "solicitud_FO-136_{matricula}.pdf",
        "fallback_filename": "solicitud_FO-136_{matricula}.docx",
        "tipo": "Solicitud FO-136",
    },
    "carta_exposicion_motivos": {
        "template": "carta_exposicion_motivos.docx",
        "filename": "carta_exposicion_motivos_{matricula}.pdf",
        "fallback_filename": "carta_exposicion_motivos_{matricula}.docx",
        "tipo": "Carta de Exposicion de Motivos",
    },
}

MESES = [
    "enero",
    "febrero",
    "marzo",
    "abril",
    "mayo",
    "junio",
    "julio",
    "agosto",
    "septiembre",
    "octubre",
    "noviembre",
    "diciembre",
]


def codigo_generacion_por_nombre(nombre_documento: str | None) -> str | None:
    nombre = (nombre_documento or "").strip().lower()
    if nombre == "carta compromiso":
        return "carta_compromiso"
    if nombre == "carta de exoneracion":
        return "carta_exoneracion"
    if nombre == "solicitud fo-136":
        return "solicitud_fo_136"
    if nombre == "carta de exposicion de motivos":
        return "carta_exposicion_motivos"
    return None


def _nombre_completo(alumno: AlumnoModel) -> str:
    return " ".join(
        parte
        for parte in [alumno.nombre, alumno.apellido_paterno, alumno.apellido_materno]
        if parte
    ) or "Alumno"


def _nombre_tipo_practica(alumno: AlumnoModel) -> str:
    nombre = (
        (alumno.tipo_practica.nombre or "").strip()
        if alumno.tipo_practica is not None
        else ""
    )
    if not nombre:
        raise HTTPException(
            status_code=409,
            detail="El alumno no tiene un tipo de practica asignado en la base de datos",
        )
    return nombre


def _responsables_documentos(alumno: AlumnoModel) -> dict[str, str]:
    db = object_session(alumno)
    cerrar_db = db is None
    if db is None:
        db = SessionLocal()

    try:
        configuracion = (
            db.query(ConfiguracionSistemaModel)
            .order_by(ConfiguracionSistemaModel.id_configuracion.asc())
            .first()
        )
        secretaria = (
            (configuracion.secretaria_academica or "").strip()
            if configuracion is not None
            else ""
        )
        coordinadora = (
            (configuracion.coordinadora_practicas or "").strip()
            if configuracion is not None
            else ""
        )
        return {
            "secretaria_academica": secretaria or "Paola Lopez",
            "coordinadora_academica": coordinadora or "Guadalupe Velazquez",
        }
    finally:
        if cerrar_db:
            db.close()


def _slug_carpeta(valor: str | None, fallback: str) -> str:
    texto = valor or fallback
    texto = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode("ascii")
    texto = re.sub(r"[^A-Za-z0-9]+", "_", texto).strip("_").lower()
    return texto or fallback


def _expediente_reciente(alumno: AlumnoModel):
    if not alumno.expedientes:
        return None
    return sorted(
        alumno.expedientes,
        key=lambda expediente: expediente.fecha_creacion,
        reverse=True,
    )[0]


def _carpeta_generados_alumno(alumno: AlumnoModel) -> Path:
    expediente = _expediente_reciente(alumno)
    nombre_alumno = "_".join(
        parte for parte in [alumno.nombre, alumno.apellido_paterno, alumno.apellido_materno, alumno.matricula] if parte
    )
    tipo_practica = _nombre_tipo_practica(alumno)
    convocatoria = f"convocatoria_{expediente.id_convocatoria}" if expediente is not None else "sin_convocatoria"
    return (
        BASE_DIR
        / "uploads"
        / "expedientes"
        / "alumnos"
        / _slug_carpeta(nombre_alumno, f"alumno_{alumno.id_alumno}")
        / _slug_carpeta(tipo_practica, "practica")
        / convocatoria
        / "generados"
    )


def _fecha_larga(hoy: date) -> str:
    return f"{hoy.day} de {MESES[hoy.month - 1]} de {hoy.year}"


def _fecha_corta(hoy: date) -> str:
    return f"{hoy.day:02d}/{hoy.month:02d}/{hoy.year}"


def _contexto(alumno: AlumnoModel) -> dict[str, str]:
    hoy = date.today()
    usuario = alumno.usuario
    carrera = alumno.carrera.nombre if alumno.carrera else ""
    expediente = _expediente_reciente(alumno)
    convocatoria = expediente.convocatoria if expediente is not None else None
    tipo_practica = _nombre_tipo_practica(alumno)
    responsables = _responsables_documentos(alumno)
    return {
        "fecha_larga": _fecha_larga(hoy),
        "fecha_corta": _fecha_corta(hoy),
        "fecha_dia": f"{hoy.day:02d}",
        "fecha_mes": f"{hoy.month:02d}",
        "fecha_anio": str(hoy.year),
        "secretaria_academica": responsables["secretaria_academica"],
        "coordinadora_academica": responsables["coordinadora_academica"],
        "nombre_practica": tipo_practica,
        "tipo_practica": tipo_practica,
        "nombre_alumno": _nombre_completo(alumno),
        "nombre": alumno.nombre or "",
        "apellido_paterno": alumno.apellido_paterno or "",
        "apellido_materno": alumno.apellido_materno or "",
        "correo": usuario.correo if usuario else "",
        "matricula": alumno.matricula,
        "carrera": carrera,
        "unidad_academica": "Facultad de Contaduria y Administracion, Campus I",
        "periodo_inicio": convocatoria.fecha_inicio_general.strftime("%d/%m/%Y") if convocatoria.fecha_inicio_general else "" if convocatoria else "",
        "periodo_fin": convocatoria.fecha_cierre_general.strftime("%d/%m/%Y") if convocatoria.fecha_cierre_general else "" if convocatoria else "",
        "periodo_inicio_dia": str(convocatoria.fecha_inicio_general.day) if convocatoria.fecha_inicio_general else "__" if convocatoria else "__",
        "periodo_inicio_mes": MESES[convocatoria.fecha_inicio_general.month - 1] if convocatoria.fecha_inicio_general else "_____" if convocatoria else "_____",
        "periodo_inicio_anio": str(convocatoria.fecha_inicio_general.year) if convocatoria.fecha_inicio_general else "_____" if convocatoria else "_____",
        "periodo_fin_dia": str(convocatoria.fecha_cierre_general.day) if convocatoria.fecha_cierre_general else "__" if convocatoria else "__",
        "periodo_fin_mes": MESES[convocatoria.fecha_cierre_general.month - 1] if convocatoria.fecha_cierre_general else "_____" if convocatoria else "_____",
        "periodo_fin_anio": str(convocatoria.fecha_cierre_general.year) if convocatoria.fecha_cierre_general else "_____" if convocatoria else "_____",
    }


def _cache_key(codigo: str, alumno: AlumnoModel) -> str:
    c = _contexto(alumno)
    datos = "|".join(f"{key}={c[key]}" for key in sorted(c))
    return f"{CACHE_VERSION}|{codigo}|{datos}"


def _safe_replace(xml: str, origen: str, destino: str) -> str:
    return xml.replace(origen, escape(destino))


def _rellenar_xml(codigo: str, xml: str, alumno: AlumnoModel) -> str:
    c = _contexto(alumno)
    if codigo == "carta_compromiso":
        reemplazos = {
            "FECHA:_": f"FECHA: {c['fecha_larga']}",
            "____________________": "",
            "NOMBRE DE": c["secretaria_academica"],
            " LA SECRETARIA ACADÉMICA": "",
            "LICENCIATURA EN ………….": f"LICENCIATURA EN {c['carrera'].upper()}",
            "Práctica: _________________": f"Práctica: {c['nombre_practica']}",
            "ráctica: _________________": f"ráctica: {c['nombre_practica']}",
            "Práctica: ________________": f"Práctica: {c['nombre_practica']}",
            "licenciatura en _________________": f"licenciatura en {c['carrera']}",
            "Nombre y firma del estudiante": c["nombre_alumno"],
        }
    elif codigo == "carta_exoneracion":
        reemplazos = {
            "FECHA": c["fecha_larga"],
            "Práctica Profesional:   .": f"Práctica Profesional: {c['tipo_practica']}.",
            "del __ de ": f"del {c['periodo_inicio_dia']} de ",
            "_____": c["periodo_inicio_mes"],
            "00000000000000000": "_________________",
            "Nombre y firma del alumno": c["nombre_alumno"],
        }
        xml = xml.replace(
            f"<w:t xml:space=\"preserve\">{escape(c['periodo_inicio_mes'])}</w:t><w:r",
            f"<w:t xml:space=\"preserve\">{escape(c['periodo_inicio_mes'])}</w:t><w:r",
            1,
        )
    elif codigo == "solicitud_fo_136":
        reemplazos = {
            "Fecha.": f"Fecha. {c['fecha_corta']}",
            "Matricula.": f"Matricula. {c['matricula']}",
            "Nombre": f"Nombre: {c['nombre']}",
            "Apellido Paterno": f"Apellido Paterno: {c['apellido_paterno']}",
            "Apellido Materno": f"Apellido Materno: {c['apellido_materno']}",
            "Correo institucional": f"Correo institucional: {c['correo']}",
            "CURP": "CURP: __________________",
            "Servicio Medico": "Servicio Medico: IMSS",
            "Numero": "Numero: ___________",
            "Unidad Académica": f"Unidad Académica: {c['unidad_academica']}",
            "Licenciatura": f"Licenciatura: {c['carrera']}",
            "Realizare Práctica profesional de:": f"Realizare Práctica profesional de: {c['tipo_practica']}",
            "Periodo:  ": f"Periodo: {c['periodo_inicio']} al {c['periodo_fin']}",
            "Nombre y Firma Estudiante": c["nombre_alumno"],
        }
    elif codigo == "carta_exposicion_motivos":
        reemplazos = {
            "Fecha: ___": f"Fecha: {c['fecha_dia']}",
            "_/____/__": f"/{c['fecha_mes']}/{c['fecha_anio']}",
            "_.": ".",
            ": _________________________________________": f": {c['coordinadora_academica']}",
            "Quién suscribe C.____________________________________ con matrícula ____________ de la Licenciatura en": (
                f"Quién suscribe C. {c['nombre_alumno']} con matrícula {c['matricula']} de la Licenciatura en"
            ),
            " Gestión Turística": f" {c['carrera']}",
            "Nombre completo y firma ": c["nombre_alumno"],
        }
    else:
        reemplazos = {}

    for origen, destino in reemplazos.items():
        xml = _safe_replace(xml, origen, destino)
    return xml


def _crear_docx_rellenado(template_path: Path, output_path: Path, codigo: str, alumno: AlumnoModel) -> None:
    with ZipFile(template_path, "r") as source, ZipFile(output_path, "w", ZIP_DEFLATED) as target:
        for item in source.infolist():
            data = source.read(item.filename)
            if item.filename == "word/document.xml":
                xml = data.decode("utf-8")
                data = _rellenar_xml(codigo, xml, alumno).encode("utf-8")
            target.writestr(item, data)


def generar_documento_oficial(codigo: str, alumno: AlumnoModel) -> tuple[Path, str, str]:
    config = DOCUMENTOS_GENERADOS.get(codigo)
    if config is None:
        raise HTTPException(status_code=404, detail="Documento oficial no encontrado")

    template_path = TEMPLATES_DIR / config["template"]
    if not template_path.exists():
        raise HTTPException(status_code=500, detail="Plantilla oficial no encontrada")

    generated_dir = _carpeta_generados_alumno(alumno)
    generated_dir.mkdir(parents=True, exist_ok=True)
    filename = config["filename"].format(matricula=alumno.matricula)
    output_path = generated_dir / filename
    meta_path = output_path.with_suffix(output_path.suffix + ".meta")
    cache_key = _cache_key(codigo, alumno)
    if (
        output_path.exists()
        and meta_path.exists()
        and meta_path.read_text(encoding="utf-8") == cache_key
        and output_path.stat().st_mtime >= template_path.stat().st_mtime
    ):
        return output_path, filename, "application/pdf"

    soffice = shutil.which("libreoffice") or shutil.which("soffice")
    if soffice is None:
        filename = config["fallback_filename"].format(matricula=alumno.matricula)
        output_path = generated_dir / filename
        _crear_docx_rellenado(template_path, output_path, codigo, alumno)
        return (
            output_path,
            filename,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

    with TemporaryDirectory() as temp_dir:
        temp_path = Path(temp_dir)
        work_docx = temp_path / config["template"]
        _crear_docx_rellenado(template_path, work_docx, codigo, alumno)
        result = subprocess.run(
            [
                soffice,
                "--headless",
                "--convert-to",
                "pdf",
                "--outdir",
                str(temp_path),
                str(work_docx),
            ],
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            check=False,
        )
        converted = work_docx.with_suffix(".pdf")
        if result.returncode != 0 or not converted.exists():
            raise HTTPException(status_code=500, detail="No se pudo generar el PDF oficial")
        shutil.copy2(converted, output_path)
        meta_path.write_text(cache_key, encoding="utf-8")

    return output_path, filename, "application/pdf"


def generar_pdf_oficial(codigo: str, alumno: AlumnoModel) -> tuple[Path, str]:
    ruta, filename, _ = generar_documento_oficial(codigo, alumno)
    return ruta, filename


def precalentar_documentos_oficiales(id_alumno: int, codigos: list[str]) -> None:
    codigos_unicos = list(dict.fromkeys(codigos))
    if not codigos_unicos:
        return
    db = SessionLocal()
    try:
        alumno = db.query(AlumnoModel).filter(AlumnoModel.id_alumno == id_alumno).first()
        if alumno is None:
            return
        for codigo in codigos_unicos:
            try:
                generar_documento_oficial(codigo, alumno)
            except Exception:
                continue
    finally:
        db.close()
