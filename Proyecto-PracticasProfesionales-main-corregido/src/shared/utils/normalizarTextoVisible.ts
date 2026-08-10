const MOJIBAKE_REEMPLAZOS: Array<[RegExp, string]> = [
  [/Ã¡/g, "á"],
  [/Ã©/g, "é"],
  [/Ã­/g, "í"],
  [/Ã³/g, "ó"],
  [/Ãº/g, "ú"],
  [/Ã/g, "Á"],
  [/Ã‰/g, "É"],
  [/Ã/g, "Í"],
  [/Ã“/g, "Ó"],
  [/Ãš/g, "Ú"],
  [/Ã±/g, "ñ"],
  [/Ã‘/g, "Ñ"],
  [/Â¿/g, "¿"],
  [/Â¡/g, "¡"],
  [/Â/g, ""],
];

const PALABRAS_REEMPLAZO: Array<[RegExp, string]> = [
  [/\brevision\b/gi, "revisión"],
  [/\brevisiones\b/gi, "revisiones"],
  [/\bnotificacion\b/gi, "notificación"],
  [/\bnotificaciones\b/gi, "notificaciones"],
  [/\bsesion\b/gi, "sesión"],
  [/\bleida\b/gi, "leída"],
  [/\bleidas\b/gi, "leídas"],
  [/\bsubio\b/gi, "subió"],
  [/\bsolicito\b/gi, "solicitó"],
  [/\breenvio\b/gi, "reenvió"],
  [/\breenviar\b/gi, "reenviar"],
  [/\bampliacion\b/gi, "ampliación"],
  [/\bcoordinacion\b/gi, "coordinación"],
  [/\bpractica\b/gi, "práctica"],
  [/\bpracticas\b/gi, "prácticas"],
  [/\bmas\b/gi, "más"],
];

function conservarMayuscula(original: string, reemplazo: string) {
  return original[0] === original[0]?.toUpperCase()
    ? reemplazo.charAt(0).toUpperCase() + reemplazo.slice(1)
    : reemplazo;
}

export function normalizarTextoVisible(texto: string | null | undefined) {
  if (!texto) return "";

  let normalizado = texto;
  MOJIBAKE_REEMPLAZOS.forEach(([patron, reemplazo]) => {
    normalizado = normalizado.replace(patron, reemplazo);
  });
  PALABRAS_REEMPLAZO.forEach(([patron, reemplazo]) => {
    normalizado = normalizado.replace(patron, (coincidencia) => conservarMayuscula(coincidencia, reemplazo));
  });

  return normalizado;
}
