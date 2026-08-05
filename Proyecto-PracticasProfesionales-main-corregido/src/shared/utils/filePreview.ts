import { nombreArchivoDescarga, nombreArchivoVisible } from "./fileName";

function escaparHtml(valor: string) {
  return valor
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function abrirVistaPreviaArchivo(blob: Blob, nombreArchivo?: string | null) {
  const url = URL.createObjectURL(blob);
  const nombreDescarga = nombreArchivoDescarga(nombreArchivo);
  const nombreVisible = nombreArchivoVisible(nombreDescarga);
  const ventana = window.open("", "_blank");

  if (!ventana) {
    window.open(url, "_blank", "noopener,noreferrer");
    return;
  }

  const esImagen = blob.type.startsWith("image/");
  const contenido = esImagen
    ? `<img src="${url}" alt="${escaparHtml(nombreVisible)}" />`
    : `<iframe src="${url}" title="${escaparHtml(nombreVisible)}"></iframe>`;

  ventana.document.write(`<!doctype html>
<html lang="es">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${escaparHtml(nombreVisible)}</title>
    <style>
      body { margin: 0; font-family: Arial, sans-serif; color: #0d2b5e; background: #f6f8fb; }
      header { display: flex; gap: 12px; align-items: center; justify-content: space-between; padding: 12px 16px; background: #fff; border-bottom: 1px solid #dfe5ef; }
      strong { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 14px; }
      a { flex: 0 0 auto; color: #fff; background: #1565c0; border-radius: 8px; padding: 8px 12px; text-decoration: none; font-size: 12px; font-weight: 700; }
      main { height: calc(100vh - 57px); display: grid; place-items: center; }
      iframe { width: 100%; height: 100%; border: 0; background: #fff; }
      img { max-width: 100%; max-height: 100%; object-fit: contain; }
    </style>
  </head>
  <body>
    <header>
      <strong title="${escaparHtml(nombreDescarga)}">${escaparHtml(nombreVisible)}</strong>
      <a href="${url}" download="${escaparHtml(nombreDescarga)}">Descargar</a>
    </header>
    <main>${contenido}</main>
  </body>
</html>`);
  ventana.document.close();
}
