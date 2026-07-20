const MAX_NOMBRE_ARCHIVO_VISIBLE = 56;
const MAX_NOMBRE_ARCHIVO_DESCARGA = 120;

export function nombreArchivoVisible(nombre?: string | null, max = MAX_NOMBRE_ARCHIVO_VISIBLE) {
  if (!nombre) return "";
  if (nombre.length <= max) return nombre;

  const punto = nombre.lastIndexOf(".");
  const extension = punto > 0 ? nombre.slice(punto) : "";
  const base = punto > 0 ? nombre.slice(0, punto) : nombre;
  const espacioBase = Math.max(12, max - extension.length - 3);

  return `${base.slice(0, espacioBase)}...${extension}`;
}

export function nombreArchivoDescarga(nombre?: string | null, fallback = "documento.pdf") {
  const seguro = (nombre || fallback)
    .replace(/[/\\]/g, "_")
    .replace(/[^A-Za-z0-9._-]/g, "_")
    .replace(/^[_\.]+|[_\.]+$/g, "");

  const normalizado = seguro || fallback;
  if (normalizado.length <= MAX_NOMBRE_ARCHIVO_DESCARGA) return normalizado;

  const punto = normalizado.lastIndexOf(".");
  const extension = punto > 0 ? normalizado.slice(punto) : "";
  const base = punto > 0 ? normalizado.slice(0, punto) : normalizado;
  const espacioBase = Math.max(12, MAX_NOMBRE_ARCHIVO_DESCARGA - extension.length);

  return `${base.slice(0, espacioBase)}${extension}`;
}
