from pathlib import Path
import re

from fastapi import HTTPException


MAX_DOCUMENTO_MB = 2
MAX_FORMATO_INSTITUCIONAL_MB = 2
MAX_ARCHIVO_ABSOLUTO_MB = 2
MAX_NOMBRE_ARCHIVO = 120
BYTES_POR_MB = 1024 * 1024

EXTENSIONES_BLOQUEADAS = {
    ".bat",
    ".cmd",
    ".com",
    ".cpl",
    ".dll",
    ".exe",
    ".hta",
    ".jar",
    ".js",
    ".lnk",
    ".msi",
    ".pif",
    ".php",
    ".ps1",
    ".reg",
    ".scr",
    ".sh",
    ".vbs",
    ".vbe",
    ".wsf",
    ".wsh",
}

EXTENSIONES_DOCUMENTO_USUARIO = {".pdf", ".jpg", ".jpeg", ".png", ".webp"}
EXTENSIONES_FORMATO_INSTITUCIONAL = {".pdf", ".doc", ".docx", ".xls", ".xlsx"}
EXTENSIONES_DOCUMENTO_LIBERACION = {".pdf", ".doc", ".docx"}
EXTENSIONES_IMPORTACION = {".csv", ".xlsx"}

MIMES_DOCUMENTO_USUARIO = {
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp",
}
MIMES_FORMATO_INSTITUCIONAL = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}
MIMES_DOCUMENTO_LIBERACION = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}
MIMES_IMPORTACION = {
    "text/csv",
    "application/csv",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
}

MENSAJE_TAMANO_DOCUMENTO = "El archivo excede el límite máximo de 2 MB."
MENSAJE_TIPO = "Tipo de archivo no permitido."
MENSAJE_NOMBRE = "El nombre del archivo no es válido."


def validar_extension_segura(filename: str | None) -> None:
    suffix = _extension(filename)
    if suffix in EXTENSIONES_BLOQUEADAS:
        raise HTTPException(status_code=400, detail=MENSAJE_TIPO)


def normalizar_nombre_archivo(filename: str | None, default: str) -> str:
    name = _validar_nombre_archivo(filename or default)
    validar_extension_segura(name)
    normalizado = re.sub(r"[^A-Za-z0-9._-]", "_", name).strip("._")
    if not normalizado:
        raise HTTPException(status_code=400, detail=MENSAJE_NOMBRE)
    return _recortar_nombre_archivo(normalizado)


def nombre_descarga_seguro(filename: str | None, default: str = "documento.pdf") -> str:
    return normalizar_nombre_archivo(filename or default, default)


def _recortar_nombre_archivo(nombre: str) -> str:
    if len(nombre) <= MAX_NOMBRE_ARCHIVO:
        return nombre

    extension = Path(nombre).suffix
    base = Path(nombre).stem
    limite_base = MAX_NOMBRE_ARCHIVO - len(extension)
    if limite_base < 12:
        return nombre[:MAX_NOMBRE_ARCHIVO]
    return f"{base[:limite_base]}{extension}"


def validar_documento_usuario(contenido: bytes, filename: str | None, content_type: str | None) -> None:
    _validar_archivo(
        contenido,
        filename,
        content_type,
        extensiones=EXTENSIONES_DOCUMENTO_USUARIO,
        mimes=MIMES_DOCUMENTO_USUARIO,
        max_mb=MAX_DOCUMENTO_MB,
    )


def validar_formato_institucional(contenido: bytes, filename: str | None, content_type: str | None) -> None:
    _validar_archivo(
        contenido,
        filename,
        content_type,
        extensiones=EXTENSIONES_FORMATO_INSTITUCIONAL,
        mimes=MIMES_FORMATO_INSTITUCIONAL,
        max_mb=MAX_FORMATO_INSTITUCIONAL_MB,
    )


def validar_documento_liberacion(contenido: bytes, filename: str | None, content_type: str | None) -> None:
    _validar_archivo(
        contenido,
        filename,
        content_type,
        extensiones=EXTENSIONES_DOCUMENTO_LIBERACION,
        mimes=MIMES_DOCUMENTO_LIBERACION,
        max_mb=MAX_DOCUMENTO_MB,
    )


def validar_archivo_importacion(contenido: bytes, filename: str | None, content_type: str | None) -> None:
    _validar_archivo(
        contenido,
        filename,
        content_type,
        extensiones=EXTENSIONES_IMPORTACION,
        mimes=MIMES_IMPORTACION,
        max_mb=MAX_ARCHIVO_ABSOLUTO_MB,
    )


def leer_uploadfile_validado_documento(archivo) -> bytes:
    contenido = archivo.file.read()
    validar_documento_usuario(contenido, archivo.filename, getattr(archivo, "content_type", None))
    archivo.file.seek(0)
    return contenido


def leer_uploadfile_validado_importacion(archivo) -> bytes:
    contenido = archivo.file.read()
    validar_archivo_importacion(contenido, archivo.filename, getattr(archivo, "content_type", None))
    archivo.file.seek(0)
    return contenido


def _extension(filename: str | None) -> str:
    return Path(str(filename or "").replace("\\", "/")).suffix.lower()


def _validar_nombre_archivo(filename: str | None) -> str:
    raw = str(filename or "").strip()
    if not raw or "/" in raw or "\\" in raw or raw in {".", ".."} or ".." in Path(raw).parts:
        raise HTTPException(status_code=400, detail=MENSAJE_NOMBRE)
    name = Path(raw).name.strip()
    if not name or name != raw:
        raise HTTPException(status_code=400, detail=MENSAJE_NOMBRE)
    return name


def _validar_archivo(
    contenido: bytes,
    filename: str | None,
    content_type: str | None,
    *,
    extensiones: set[str],
    mimes: set[str],
    max_mb: int,
    mensaje_tamano: str = MENSAJE_TAMANO_DOCUMENTO,
) -> None:
    name = _validar_nombre_archivo(filename)
    extension = _extension(name)
    validar_extension_segura(name)
    if extension not in extensiones:
        raise HTTPException(status_code=400, detail=MENSAJE_TIPO)
    if content_type and content_type.split(";", 1)[0].strip().lower() not in mimes:
        raise HTTPException(status_code=400, detail=MENSAJE_TIPO)
    if len(contenido) > max_mb * BYTES_POR_MB:
        raise HTTPException(status_code=400, detail=mensaje_tamano)
    if len(contenido) > MAX_ARCHIVO_ABSOLUTO_MB * BYTES_POR_MB:
        raise HTTPException(status_code=400, detail=MENSAJE_TAMANO_DOCUMENTO)
    if extension == ".pdf":
        _validar_pdf_legible(contenido)


def _validar_pdf_legible(contenido: bytes) -> None:
    try:
        if not contenido.startswith(b"%PDF-"):
            raise ValueError
        cola = contenido[-2048:] if len(contenido) > 2048 else contenido
        if cola.rfind(b"%%EOF") < 0:
            raise ValueError
        startxref_index = contenido.rfind(b"startxref")
        if startxref_index < 0:
            raise ValueError
        lineas = contenido[startxref_index + len(b"startxref"):].strip().splitlines()
        if not lineas:
            raise ValueError
        xref_offset = int(lineas[0].strip())
        if xref_offset < 0 or xref_offset >= len(contenido):
            raise ValueError
        bloque_xref = contenido[xref_offset:xref_offset + 512]
        if bloque_xref.startswith(b"xref"):
            return
        if b" obj" in bloque_xref and b"/XRef" in bloque_xref:
            return
        else:
            raise ValueError
    except Exception as exc:
        raise HTTPException(status_code=400, detail="No fue posible leer el documento.") from exc


def resolver_archivo_en_uploads(ruta_archivo: str | None, uploads_root: Path) -> Path:
    if not ruta_archivo:
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    raiz = uploads_root.resolve()
    ruta = Path(ruta_archivo)
    ruta_resuelta = ruta.resolve()

    try:
        ruta_resuelta.relative_to(raiz)
    except ValueError as exc:
        raise HTTPException(status_code=404, detail="Archivo no encontrado") from exc

    if not ruta_resuelta.exists() or not ruta_resuelta.is_file():
        raise HTTPException(status_code=404, detail="Archivo no encontrado")

    return ruta_resuelta
