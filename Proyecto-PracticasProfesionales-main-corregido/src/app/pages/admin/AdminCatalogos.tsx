import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Archive,
  CalendarDays,
  CheckCircle2,
  Database,
  Download,
  Edit2,
  Eye,
  FileSpreadsheet,
  GraduationCap,
  KeyRound,
  Plus,
  Power,
  RefreshCw,
  Trash2,
  Upload,
  X,
} from "lucide-react";

import {
  actualizarCarrera,
  actualizarConvocatoria,
  actualizarTipoPractica,
  cerrarConvocatoria,
  crearCarrera,
  crearConvocatoria,
  crearTipoPractica,
  desactivarConvocatoria,
  eliminarCarrera,
  eliminarConvocatoria,
  importarAlumnosMasivo,
  importarPersonalMasivo,
  obtenerCarreras,
  obtenerConvocatorias,
  obtenerTiposPractica,
  validarAlumnosMasivo,
  validarPersonalMasivo,
} from "../../../infrastructure/catalogos/catalogosApi";

import type { ColoredStatCard } from "../../../shared/types/ui";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

type CatalogoActivo = "carreras" | "convocatorias" | "tipos-practica" | null;
type TipoCarga = "alumnos" | "personal";

type Carrera = {
  id_carrera: number;
  nombre: string;
  tipo_periodo: "Semestral" | "Cuatrimestral";
  estado: "Activa" | "Inactiva";
};

type Convocatoria = {
  id_convocatoria: number;
  nombre: string;
  tipo_periodo: "Semestral" | "Cuatrimestral";
  estado: "Activa" | "Inactiva" | "Cerrada";
  fecha_inicio_general: string | null;
  fecha_cierre_general: string | null;
  fecha_inicio_empresas: string | null;
  fecha_cierre_empresas: string | null;
  fecha_inicio_documentos: string | null;
  fecha_cierre_documentos: string | null;
  fecha_inicio_validacion: string | null;
  fecha_cierre_validacion: string | null;
  fecha_inicio_seleccion: string | null;
  fecha_cierre_seleccion: string | null;
  fecha_inicio_asignacion: string | null;
  fecha_cierre_asignacion: string | null;
  fecha_inicio_practicas: string | null;
  fecha_cierre_practicas: string | null;
  fecha_inicio_cierre: string | null;
  fecha_cierre_cierre: string | null;
  observaciones: string | null;
  fase_actual: string;
};

type TipoPractica = {
  id_tipo_practica: number;
  nombre: string;
  semestre_requerido: number | null;
  creditos_minimos: number | null;
  horas_requeridas: number | null;
  orden: number | null;
  activo: boolean;
};

type ResultadoValidacion = {
  total: number;
  validos: number;
  errores: Array<{ fila: number; error: string }>;
  vista_previa?: Array<Record<string, string | number | boolean | null>>;
};

type ResultadoImportacion = {
  importados?: number;
  errores?: Array<{ fila: number; error: string }>;
  credenciales?: Array<Record<string, string | number>>;
  mensaje_credenciales?: string;
};

const carreraInicial: Carrera = {
  id_carrera: 0,
  nombre: "",
  tipo_periodo: "Semestral",
  estado: "Activa",
};

const convocatoriaInicial: Convocatoria = {
  id_convocatoria: 0,
  nombre: "",
  tipo_periodo: "Semestral",
  estado: "Activa",
  fecha_inicio_general: null,
  fecha_cierre_general: null,
  fecha_inicio_empresas: null,
  fecha_cierre_empresas: null,
  fecha_inicio_documentos: null,
  fecha_cierre_documentos: null,
  fecha_inicio_validacion: null,
  fecha_cierre_validacion: null,
  fecha_inicio_seleccion: null,
  fecha_cierre_seleccion: null,
  fecha_inicio_asignacion: null,
  fecha_cierre_asignacion: null,
  fecha_inicio_practicas: null,
  fecha_cierre_practicas: null,
  fecha_inicio_cierre: null,
  fecha_cierre_cierre: null,
  observaciones: "",
  fase_actual: "Sin calendario",
};

const tipoPracticaInicial: TipoPractica = {
  id_tipo_practica: 0,
  nombre: "",
  semestre_requerido: 5,
  creditos_minimos: 0,
  horas_requeridas: 480,
  orden: 1,
  activo: true,
};

type EtapaConvocatoria = {
  orden: number;
  nombre: string;
  descripcion: string;
  inicioCampo: keyof Convocatoria;
  cierreCampo: keyof Convocatoria;
};

const etapasConvocatoria: EtapaConvocatoria[] = [
  {
    orden: 1,
    nombre: "General",
    descripcion: "Rango completo en el que existe el proceso de practicas.",
    inicioCampo: "fecha_inicio_general",
    cierreCampo: "fecha_cierre_general",
  },
  {
    orden: 2,
    nombre: "Empresas",
    descripcion: "Registro de participacion y captura de vacantes.",
    inicioCampo: "fecha_inicio_empresas",
    cierreCampo: "fecha_cierre_empresas",
  },
  {
    orden: 3,
    nombre: "Documentos",
    descripcion: "Inscripcion y carga documental de alumnos.",
    inicioCampo: "fecha_inicio_documentos",
    cierreCampo: "fecha_cierre_documentos",
  },
  {
    orden: 4,
    nombre: "Validacion",
    descripcion: "Revision documental por coordinacion.",
    inicioCampo: "fecha_inicio_validacion",
    cierreCampo: "fecha_cierre_validacion",
  },
  {
    orden: 5,
    nombre: "Seleccion",
    descripcion: "Eleccion de vacantes por alumnos.",
    inicioCampo: "fecha_inicio_seleccion",
    cierreCampo: "fecha_cierre_seleccion",
  },
  {
    orden: 6,
    nombre: "Asignacion",
    descripcion: "Confirmacion y asignacion formal de practicas.",
    inicioCampo: "fecha_inicio_asignacion",
    cierreCampo: "fecha_cierre_asignacion",
  },
  {
    orden: 7,
    nombre: "Practicas",
    descripcion: "Periodo de reportes, horas y seguimiento.",
    inicioCampo: "fecha_inicio_practicas",
    cierreCampo: "fecha_cierre_practicas",
  },
  {
    orden: 8,
    nombre: "Cierre",
    descripcion: "Liberacion y cierre administrativo del expediente.",
    inicioCampo: "fecha_inicio_cierre",
    cierreCampo: "fecha_cierre_cierre",
  },
];

function validarCalendarioConvocatoria(form: Convocatoria): string | null {
  for (const { inicioCampo, cierreCampo } of etapasConvocatoria) {
    if (!form[inicioCampo] || !form[cierreCampo]) {
      return "La convocatoria no tiene calendario completo.";
    }
  }

  const reglas = [
    form.fecha_inicio_general! <= form.fecha_cierre_general!,
    form.fecha_inicio_empresas! >= form.fecha_inicio_general!,
    form.fecha_cierre_empresas! <= form.fecha_cierre_general!,
    form.fecha_inicio_empresas! <= form.fecha_cierre_empresas!,
    form.fecha_inicio_documentos! >= form.fecha_inicio_general!,
    form.fecha_cierre_documentos! <= form.fecha_cierre_general!,
    form.fecha_inicio_documentos! <= form.fecha_cierre_documentos!,
    form.fecha_inicio_validacion! >= form.fecha_inicio_documentos!,
    form.fecha_cierre_validacion! <= form.fecha_cierre_general!,
    form.fecha_inicio_validacion! <= form.fecha_cierre_validacion!,
    form.fecha_inicio_seleccion! >= form.fecha_cierre_validacion!,
    form.fecha_cierre_seleccion! <= form.fecha_cierre_general!,
    form.fecha_inicio_seleccion! <= form.fecha_cierre_seleccion!,
    form.fecha_inicio_asignacion! >= form.fecha_cierre_seleccion!,
    form.fecha_cierre_asignacion! <= form.fecha_cierre_general!,
    form.fecha_inicio_asignacion! <= form.fecha_cierre_asignacion!,
    form.fecha_inicio_practicas! >= form.fecha_cierre_asignacion!,
    form.fecha_cierre_practicas! <= form.fecha_cierre_general!,
    form.fecha_inicio_practicas! <= form.fecha_cierre_practicas!,
    form.fecha_inicio_cierre! >= form.fecha_cierre_practicas!,
    form.fecha_cierre_cierre! <= form.fecha_cierre_general!,
    form.fecha_inicio_cierre! <= form.fecha_cierre_cierre!,
  ];

  return reglas.every(Boolean) ? null : "El calendario de la convocatoria no respeta el flujo de etapas.";
}

function obtenerResumenCalendario(form: Convocatoria) {
  const completo = etapasConvocatoria.every(({ inicioCampo, cierreCampo }) => form[inicioCampo] && form[cierreCampo]);
  const error = completo ? validarCalendarioConvocatoria(form) : "La convocatoria no tiene calendario completo.";
  return {
    completo,
    flujoValido: !error,
    error,
  };
}

function obtenerEstadoEtapa(form: Convocatoria, etapa: EtapaConvocatoria) {
  const inicio = form[etapa.inicioCampo] as string | null;
  const cierre = form[etapa.cierreCampo] as string | null;
  if (!inicio || !cierre) {
    return {
      texto: "Incompleta",
      clase: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icono: AlertTriangle,
    };
  }
  if (inicio > cierre) {
    return {
      texto: "Desordenada",
      clase: "bg-red-50 text-red-700 border-red-200",
      icono: AlertTriangle,
    };
  }
  return {
    texto: "Completa",
    clase: "bg-green-50 text-green-700 border-green-200",
    icono: CheckCircle2,
  };
}

const columnasAlumnos = [
  "nombre",
  "apellido_paterno",
  "apellido_materno",
  "correo",
  "matricula",
  "carrera",
  "semestre",
  "grupo",
  "tipo_practica",
  "creditos_aprobados",
];

const columnasPersonal = [
  "nombre",
  "apellido_paterno",
  "apellido_materno",
  "correo",
  "rol",
  "departamento",
  "cargo",
  "telefono",
];

const ejemploAlumnosCarga = [
  "Ana",
  "Perez",
  "Lopez",
  "ana.perez@unach.mx",
  "A012345",
  "Ingenieria en Software",
  "5",
  "A",
  "Practicas 1",
  "120",
];

const ejemploPersonalCarga = [
  "Luis",
  "Garcia",
  "Mendez",
  "luis.garcia@unach.mx",
  "Asesor Interno",
  "Sistemas",
  "Docente",
  "9611234567",
];

const rolesPersonalPlantilla = [
  "Administrador",
  "Coordinador de Practicas",
  "Coordinador de Unidades Receptoras",
  "Asesor Interno",
  "Direccion",
];

const erroresPersonalPlantilla = [
  "No usar id_rol.",
  "No usar id_empresa.",
  "No usar rol Alumno.",
  "No usar rol Unidad Receptora.",
  "No ligar personal a empresas.",
];

function fechaTexto(fecha?: string | null) {
  if (!fecha) return "Sin fecha";
  const date = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(date.getTime())) return fecha;
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function descargarCsv(nombre: string, filas: Array<Array<string | number>>) {
  const contenido = filas
    .map((fila) =>
      fila
        .map((valor) => `"${String(valor).replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");
  const blob = new Blob([contenido], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombre;
  link.click();
  URL.revokeObjectURL(url);
}

function xmlEscape(valor: string | number) {
  return String(valor)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function columnaExcel(indice: number) {
  let nombre = "";
  let numero = indice + 1;
  while (numero > 0) {
    const resto = (numero - 1) % 26;
    nombre = String.fromCharCode(65 + resto) + nombre;
    numero = Math.floor((numero - 1) / 26);
  }
  return nombre;
}

type CeldaExcel = string | number | { value: string | number; style?: number };

function celda(value: string | number, style?: number): CeldaExcel {
  return { value, style };
}

function valorCelda(item: CeldaExcel) {
  return typeof item === "object" && "value" in item ? item.value : item;
}

function estiloCelda(item: CeldaExcel, rowIndex: number) {
  if (typeof item === "object" && "value" in item) return item.style ?? 0;
  return rowIndex === 0 ? 1 : 0;
}

function hojaXml(
  filas: Array<Array<CeldaExcel>>,
  anchos: number[] = [],
  congelarFila?: number,
  merges: string[] = [],
) {
  const cols = anchos.length
    ? `<cols>${anchos.map((ancho, index) => `<col min="${index + 1}" max="${index + 1}" width="${ancho}" customWidth="1"/>`).join("")}</cols>`
    : "";
  const sheetViews = congelarFila
    ? `<sheetViews><sheetView workbookViewId="0"><pane ySplit="${congelarFila}" topLeftCell="A${congelarFila + 1}" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews>`
    : "";
  const rows = filas.map((fila, rowIndex) => {
    const rowNumber = rowIndex + 1;
    const cells = fila.map((item, colIndex) => {
      const ref = `${columnaExcel(colIndex)}${rowNumber}`;
      return `<c r="${ref}" t="inlineStr" s="${estiloCelda(item, rowIndex)}"><is><t>${xmlEscape(valorCelda(item))}</t></is></c>`;
    }).join("");
    return `<row r="${rowNumber}">${cells}</row>`;
  }).join("");
  const mergeCells = merges.length
    ? `<mergeCells count="${merges.length}">${merges.map((ref) => `<mergeCell ref="${ref}"/>`).join("")}</mergeCells>`
    : "";

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${sheetViews}${cols}<sheetData>${rows}</sheetData>${mergeCells}</worksheet>`;
}

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function uint16(valor: number) {
  return [valor & 255, (valor >>> 8) & 255];
}

function uint32(valor: number) {
  return [valor & 255, (valor >>> 8) & 255, (valor >>> 16) & 255, (valor >>> 24) & 255];
}

function crearZip(files: Array<{ name: string; content: string }>) {
  const encoder = new TextEncoder();
  const locales: Uint8Array[] = [];
  const centrales: Uint8Array[] = [];
  let offset = 0;

  files.forEach((file) => {
    const nameBytes = encoder.encode(file.name);
    const contentBytes = encoder.encode(file.content);
    const crc = crc32(contentBytes);
    const localHeader = new Uint8Array([
      ...uint32(0x04034b50), ...uint16(20), ...uint16(0), ...uint16(0), ...uint16(0), ...uint16(0),
      ...uint32(crc), ...uint32(contentBytes.length), ...uint32(contentBytes.length),
      ...uint16(nameBytes.length), ...uint16(0),
    ]);
    const local = new Uint8Array(localHeader.length + nameBytes.length + contentBytes.length);
    local.set(localHeader);
    local.set(nameBytes, localHeader.length);
    local.set(contentBytes, localHeader.length + nameBytes.length);
    locales.push(local);

    const centralHeader = new Uint8Array([
      ...uint32(0x02014b50), ...uint16(20), ...uint16(20), ...uint16(0), ...uint16(0), ...uint16(0), ...uint16(0),
      ...uint32(crc), ...uint32(contentBytes.length), ...uint32(contentBytes.length),
      ...uint16(nameBytes.length), ...uint16(0), ...uint16(0), ...uint16(0), ...uint16(0), ...uint32(0),
      ...uint32(offset),
    ]);
    const central = new Uint8Array(centralHeader.length + nameBytes.length);
    central.set(centralHeader);
    central.set(nameBytes, centralHeader.length);
    centrales.push(central);
    offset += local.length;
  });

  const centralSize = centrales.reduce((total, item) => total + item.length, 0);
  const end = new Uint8Array([
    ...uint32(0x06054b50), ...uint16(0), ...uint16(0), ...uint16(files.length), ...uint16(files.length),
    ...uint32(centralSize), ...uint32(offset), ...uint16(0),
  ]);
  const totalSize = offset + centralSize + end.length;
  const zip = new Uint8Array(totalSize);
  let cursor = 0;
  [...locales, ...centrales, end].forEach((item) => {
    zip.set(item, cursor);
    cursor += item.length;
  });
  return zip;
}

function descargarXlsx(nombre: string, sheets: Array<{ name: string; rows: Array<Array<CeldaExcel>>; widths?: number[]; freezeRow?: number; merges?: string[] }>) {
  const workbookSheets = sheets
    .map((sheet, index) => `<sheet name="${xmlEscape(sheet.name)}" sheetId="${index + 1}" r:id="rId${index + 1}"/>`)
    .join("");
  const rels = sheets
    .map((_, index) => `<Relationship Id="rId${index + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${index + 1}.xml"/>`)
    .join("");
  const worksheetOverrides = sheets
    .map((_, index) => `<Override PartName="/xl/worksheets/sheet${index + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`)
    .join("");
  const files = [
    {
      name: "[Content_Types].xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>${worksheetOverrides}</Types>`,
    },
    {
      name: "_rels/.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    },
    {
      name: "xl/workbook.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets>${workbookSheets}</sheets></workbook>`,
    },
    {
      name: "xl/_rels/workbook.xml.rels",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${rels}<Relationship Id="rId${sheets.length + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    },
    {
      name: "xl/styles.xml",
      content: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?><styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><fonts count="5"><font><sz val="11"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="16"/><name val="Calibri"/></font><font><b/><color rgb="FF0D2B5E"/><sz val="12"/><name val="Calibri"/></font><font><b/><color rgb="FFFFFFFF"/><sz val="11"/><name val="Calibri"/></font><font><color rgb="FF374151"/><sz val="11"/><name val="Calibri"/></font></fonts><fills count="8"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FF1565C0"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFEAF4FF"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FF0D2B5E"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFE8F5E9"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFF7D6"/><bgColor indexed="64"/></patternFill></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFFEBEE"/><bgColor indexed="64"/></patternFill></fill></fills><borders count="2"><border><left/><right/><top/><bottom/><diagonal/></border><border><left style="thin"><color rgb="FFCBD5E1"/></left><right style="thin"><color rgb="FFCBD5E1"/></right><top style="thin"><color rgb="FFCBD5E1"/></top><bottom style="thin"><color rgb="FFCBD5E1"/></bottom><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="8"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="0" fontId="2" fillId="3" borderId="0" xfId="0" applyFont="1" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="0" fontId="3" fillId="4" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="center"/></xf><xf numFmtId="0" fontId="0" fillId="5" borderId="1" xfId="0" applyFill="1" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="4" fillId="6" borderId="0" xfId="0" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="0" fillId="0" borderId="1" xfId="0" applyBorder="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf><xf numFmtId="0" fontId="0" fillId="7" borderId="0" xfId="0" applyFill="1" applyAlignment="1"><alignment wrapText="1" vertical="top"/></xf></cellXfs></styleSheet>`,
    },
    ...sheets.map((sheet, index) => ({
      name: `xl/worksheets/sheet${index + 1}.xml`,
      content: hojaXml(sheet.rows, sheet.widths, sheet.freezeRow, sheet.merges),
    })),
  ];
  const blob = new Blob([crearZip(files)], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = nombre;
  link.click();
  URL.revokeObjectURL(url);
}

export function AdminCatalogos() {
  const [carreras, setCarreras] = useState<Carrera[]>([]);
  const [convocatorias, setConvocatorias] = useState<Convocatoria[]>([]);
  const [tiposPractica, setTiposPractica] = useState<TipoPractica[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [tipoCarga, setTipoCarga] = useState<TipoCarga>("alumnos");
  const [resultadoValidacion, setResultadoValidacion] = useState<ResultadoValidacion | null>(null);
  const [resultadoImportacion, setResultadoImportacion] = useState<ResultadoImportacion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [catalogoActivo, setCatalogoActivo] = useState<CatalogoActivo>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [carreraForm, setCarreraForm] = useState<Carrera>(carreraInicial);
  const [convocatoriaForm, setConvocatoriaForm] = useState<Convocatoria>(convocatoriaInicial);
  const [tipoPracticaForm, setTipoPracticaForm] = useState<TipoPractica>(tipoPracticaInicial);

  useEffect(() => {
    void cargarCatalogos();
  }, []);

  async function cargarCatalogos() {
    try {
      setCargando(true);
      setError("");
      const [carrerasData, convocatoriasData, tiposPracticaData] = await Promise.all([
        obtenerCarreras(),
        obtenerConvocatorias(),
        obtenerTiposPractica(),
      ]);
      setCarreras(carrerasData);
      setConvocatorias(convocatoriasData);
      setTiposPractica(tiposPracticaData);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los catalogos.");
    } finally {
      setCargando(false);
    }
  }

  function limpiarFormularios() {
    setCarreraForm(carreraInicial);
    setConvocatoriaForm(convocatoriaInicial);
    setTipoPracticaForm(tipoPracticaInicial);
  }

  function abrirCatalogo(tipo: CatalogoActivo) {
    setCatalogoActivo(tipo);
    setModoEdicion(false);
    limpiarFormularios();
    setMensaje("");
    setError("");
  }

  function cerrarModal() {
    setCatalogoActivo(null);
    setModoEdicion(false);
    limpiarFormularios();
  }

  function reiniciarCarga(nuevoTipo = tipoCarga) {
    setTipoCarga(nuevoTipo);
    setArchivo(null);
    setResultadoValidacion(null);
    setResultadoImportacion(null);
    setMensaje("");
    setError("");
  }

  function descargarPlantillaExcel() {
    if (tipoCarga === "alumnos") {
      const carrerasPlantilla = carreras.length
        ? carreras.map((carrera) => [celda(carrera.nombre, 6)])
        : [[celda("Ingenieria en Software", 6)], [celda("Deben existir previamente en Admin > Carreras.", 5)]];
      const tiposPracticaPlantilla = tiposPractica.length
        ? tiposPractica.map((tipo) => [celda(tipo.nombre, 6)])
        : [["Practicas 1"], ["Practicas 2"], ["Residencia"]].map(([tipo]) => [celda(tipo, 6)]);

      descargarXlsx("plantilla_alumnos.xlsx", [
        {
          name: "Plantilla Alumnos",
          rows: [
            [celda("PLANTILLA DE CARGA MASIVA DE ALUMNOS", 1)],
            [],
            [celda("INSTRUCCIONES RAPIDAS", 2)],
            [
              celda("No cambiar nombres de columnas. Llenar una fila por alumno. La carrera debe existir previamente en Admin > Carreras.", 5),
              "", "", "", "",
              celda("El periodo no se captura; se asigna automaticamente desde la carrera.", 5),
            ],
            [
              celda("tipo_practica debe coincidir con el catalogo.", 5),
              "", "", "", "",
              celda("correo y matricula deben ser unicos. semestre y creditos_aprobados deben ser numericos.", 5),
            ],
            [],
            [],
            [celda("DATOS A CAPTURAR", 2)],
            columnasAlumnos.map((columna) => celda(columna, 3)),
            ...Array.from({ length: 21 }, () => columnasAlumnos.map(() => celda("", 6))),
            [],
            [celda("EJEMPLO CORRECTO, NO IMPORTAR", 2)],
            ejemploAlumnosCarga.map((valor) => celda(valor, 4)),
            [],
            [],
            [celda("Catalogo de tipos de practica", 2), "", "", "", "", celda("Errores comunes", 2)],
            ...Array.from({ length: 6 }, (_, index) => [
              tiposPracticaPlantilla[index]?.[0] ?? "",
              "", "", "",
              "",
              [
                "No cambiar encabezados.",
                "No escribir carreras inexistentes.",
                "No escribir tipo_practica inventado.",
                "No dejar correo vacio.",
                "No repetir matricula.",
                "No escribir periodo.",
              ][index] ? celda([
                "No cambiar encabezados.",
                "No escribir carreras inexistentes.",
                "No escribir tipo_practica inventado.",
                "No dejar correo vacio.",
                "No repetir matricula.",
                "No escribir periodo.",
              ][index], 7) : "",
            ]),
            [],
            [],
            [celda("Carreras disponibles", 2)],
            ...carrerasPlantilla.map((fila) => [fila[0]]),
          ],
          widths: [18, 20, 20, 30, 15, 30, 12, 10, 20, 18],
          freezeRow: 9,
          merges: [
            "A1:J1",
            "A3:J3",
            "A4:E4",
            "F4:J4",
            "A5:E5",
            "F5:J5",
            "A8:J8",
            "A32:J32",
            "A36:D36",
            "F36:J36",
            "A45:J45",
          ],
        },
      ]);
      return;
    }

    descargarXlsx("plantilla_personal.xlsx", [
      {
        name: "Plantilla Personal",
        rows: [
          [celda("PLANTILLA DE CARGA MASIVA DE PERSONAL", 1)],
          [],
          [celda("INSTRUCCIONES RAPIDAS", 2)],
          [
            celda("No cambiar nombres de columnas. Personal no se liga a empresas. No se usa id_empresa ni id_rol.", 5),
            "", "", "",
            celda("El rol se escribe por nombre. correo debe ser unico. telefono es opcional.", 5),
          ],
          [
            celda("No se permite Alumno ni Unidad Receptora.", 5),
            "", "", "",
            celda("Unidad Receptora se crea desde el flujo de empresas aceptadas.", 5),
          ],
          [],
          [],
          [celda("DATOS A CAPTURAR", 2)],
          columnasPersonal.map((columna) => celda(columna, 3)),
          ...Array.from({ length: 21 }, () => columnasPersonal.map(() => celda("", 6))),
          [],
          [celda("EJEMPLO CORRECTO, NO IMPORTAR", 2)],
          ejemploPersonalCarga.map((valor) => celda(valor, 4)),
          [],
          [celda("Roles permitidos", 2), "", "", "", celda("Errores comunes", 2)],
          ...rolesPersonalPlantilla.map((rol, index) => [
            celda(rol, 6),
            "", "", "",
            erroresPersonalPlantilla[index] ? celda(erroresPersonalPlantilla[index], 7) : "",
          ]),
        ],
        widths: [18, 20, 20, 30, 34, 22, 18, 16],
        freezeRow: 9,
        merges: [
          "A1:H1",
          "A3:H3",
          "A4:D4",
          "E4:H4",
          "A5:D5",
          "E5:H5",
          "A8:H8",
          "A32:H32",
          "A36:D36",
          "E36:H36",
        ],
      },
    ]);
  }

  function descargarErrores() {
    const errores = resultadoValidacion?.errores ?? resultadoImportacion?.errores ?? [];
    descargarCsv("errores_importacion.csv", [
      ["fila", "error"],
      ...errores.map((item) => [item.fila, item.error]),
    ]);
  }

  function descargarCredenciales() {
    const credenciales = resultadoImportacion?.credenciales ?? [];
    if (credenciales.length === 0) return;
    const encabezados = Object.keys(credenciales[0]);
    descargarCsv("credenciales_temporales.csv", [
      encabezados,
      ...credenciales.map((item) => encabezados.map((encabezado) => item[encabezado] ?? "")),
    ]);
  }

  async function handleValidarArchivo() {
    if (!archivo) {
      setError("Selecciona un archivo antes de validar.");
      return;
    }

    try {
      setCargando(true);
      setError("");
      setMensaje("");
      setResultadoImportacion(null);
      const resultado =
        tipoCarga === "alumnos"
          ? await validarAlumnosMasivo(archivo)
          : await validarPersonalMasivo(archivo);
      setResultadoValidacion(resultado);
      setMensaje("Archivo validado. Revisa la vista previa y los errores antes de importar.");
    } catch (err) {
      console.error(err);
      setError("No se pudo validar el archivo.");
    } finally {
      setCargando(false);
    }
  }

  async function handleImportarArchivo() {
    if (!archivo) {
      setError("Selecciona un archivo antes de importar.");
      return;
    }

    if (!resultadoValidacion) {
      setError("Valida el archivo antes de importar.");
      return;
    }

    if (resultadoValidacion.errores.length) {
      setError("Corrige los errores antes de importar.");
      return;
    }

    try {
      setCargando(true);
      setError("");
      const resultado =
        tipoCarga === "alumnos"
          ? await importarAlumnosMasivo(archivo)
          : await importarPersonalMasivo(archivo);
      setResultadoImportacion(resultado);
      setMensaje(`Se importaron ${resultado.importados ?? 0} registros correctamente.`);
      setResultadoValidacion(null);
      setArchivo(null);
      await cargarCatalogos();
    } catch (err) {
      console.error(err);
      setError("No se pudo importar el archivo.");
    } finally {
      setCargando(false);
    }
  }

  async function guardarCarrera() {
    if (!carreraForm.nombre.trim()) {
      setError("El nombre de carrera es obligatorio.");
      return;
    }

    try {
      setCargando(true);
      setError("");
      if (modoEdicion) {
        await actualizarCarrera(carreraForm.id_carrera, {
          nombre: carreraForm.nombre.trim(),
          tipo_periodo: carreraForm.tipo_periodo,
          estado: carreraForm.estado,
        });
        setMensaje("Carrera actualizada.");
      } else {
        await crearCarrera({
          nombre: carreraForm.nombre.trim(),
          tipo_periodo: carreraForm.tipo_periodo,
          estado: carreraForm.estado,
        });
        setMensaje("Carrera creada.");
      }
      limpiarFormularios();
      setModoEdicion(false);
      await cargarCatalogos();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar la carrera.");
    } finally {
      setCargando(false);
    }
  }

  async function guardarConvocatoria() {
    if (!convocatoriaForm.nombre.trim()) {
      setError("El nombre de la convocatoria es obligatorio.");
      return;
    }

    const errorCalendario = validarCalendarioConvocatoria(convocatoriaForm);
    if (errorCalendario) {
      setError(errorCalendario);
      return;
    }

    const data = {
      nombre: convocatoriaForm.nombre.trim(),
      tipo_periodo: convocatoriaForm.tipo_periodo,
      estado: convocatoriaForm.estado,
      fecha_inicio_general: convocatoriaForm.fecha_inicio_general || null,
      fecha_cierre_general: convocatoriaForm.fecha_cierre_general || null,
      fecha_inicio_empresas: convocatoriaForm.fecha_inicio_empresas || null,
      fecha_cierre_empresas: convocatoriaForm.fecha_cierre_empresas || null,
      fecha_inicio_documentos: convocatoriaForm.fecha_inicio_documentos || null,
      fecha_cierre_documentos: convocatoriaForm.fecha_cierre_documentos || null,
      fecha_inicio_validacion: convocatoriaForm.fecha_inicio_validacion || null,
      fecha_cierre_validacion: convocatoriaForm.fecha_cierre_validacion || null,
      fecha_inicio_seleccion: convocatoriaForm.fecha_inicio_seleccion || null,
      fecha_cierre_seleccion: convocatoriaForm.fecha_cierre_seleccion || null,
      fecha_inicio_asignacion: convocatoriaForm.fecha_inicio_asignacion || null,
      fecha_cierre_asignacion: convocatoriaForm.fecha_cierre_asignacion || null,
      fecha_inicio_practicas: convocatoriaForm.fecha_inicio_practicas || null,
      fecha_cierre_practicas: convocatoriaForm.fecha_cierre_practicas || null,
      fecha_inicio_cierre: convocatoriaForm.fecha_inicio_cierre || null,
      fecha_cierre_cierre: convocatoriaForm.fecha_cierre_cierre || null,
      observaciones: convocatoriaForm.observaciones?.trim() || null,
    };

    try {
      setCargando(true);
      setError("");
      if (modoEdicion) {
        await actualizarConvocatoria(convocatoriaForm.id_convocatoria, data);
        setMensaje("Convocatoria actualizada.");
      } else {
        await crearConvocatoria(data);
        setMensaje("Convocatoria creada.");
      }
      limpiarFormularios();
      setModoEdicion(false);
      await cargarCatalogos();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo guardar la convocatoria."));
    } finally {
      setCargando(false);
    }
  }

  async function guardarTipoPractica() {
    if (!tipoPracticaForm.nombre.trim()) {
      setError("El nombre del tipo de practica es obligatorio.");
      return;
    }

    if (
      (tipoPracticaForm.semestre_requerido ?? 0) < 1 ||
      (tipoPracticaForm.creditos_minimos ?? 0) < 0 ||
      (tipoPracticaForm.horas_requeridas ?? 0) < 1 ||
      (tipoPracticaForm.orden ?? 0) < 1
    ) {
      setError("Semestre, horas y orden deben ser mayores a 0; creditos minimos no puede ser negativo.");
      return;
    }

    try {
      setCargando(true);
      setError("");
      const data = {
        nombre: tipoPracticaForm.nombre.trim(),
        semestre_requerido: tipoPracticaForm.semestre_requerido ?? 1,
        creditos_minimos: tipoPracticaForm.creditos_minimos ?? 0,
        horas_requeridas: tipoPracticaForm.horas_requeridas ?? 480,
        orden: tipoPracticaForm.orden ?? null,
        activo: tipoPracticaForm.activo,
      };
      if (modoEdicion && tipoPracticaForm.id_tipo_practica) {
        await actualizarTipoPractica(tipoPracticaForm.id_tipo_practica, data);
        setMensaje("Tipo de practica actualizado.");
      } else {
        await crearTipoPractica(data);
        setMensaje("Tipo de practica creado.");
      }
      setModoEdicion(false);
      setTipoPracticaForm(tipoPracticaInicial);
      await cargarCatalogos();
    } catch (err) {
      console.error(err);
      setError("No se pudo guardar el tipo de practica.");
    } finally {
      setCargando(false);
    }
  }

  async function eliminarItem(tipo: CatalogoActivo, id: number) {
    const confirmar = window.confirm("Deseas desactivar o cerrar este registro?");
    if (!confirmar) return;

    try {
      setCargando(true);
      setError("");
      if (tipo === "carreras") await eliminarCarrera(id);
      if (tipo === "convocatorias") await eliminarConvocatoria(id);
      setMensaje("Registro actualizado.");
      await cargarCatalogos();
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el estado del registro.");
    } finally {
      setCargando(false);
    }
  }

  async function eliminarConvocatoriaAdmin(convocatoria: Convocatoria) {
    const confirmar = window.confirm(`Eliminar la convocatoria "${convocatoria.nombre}"? Esta accion no se puede deshacer.`);
    if (!confirmar) return;

    try {
      setCargando(true);
      setError("");
      await eliminarConvocatoria(convocatoria.id_convocatoria);
      setMensaje("Convocatoria eliminada.");
      await cargarCatalogos();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo eliminar la convocatoria."));
    } finally {
      setCargando(false);
    }
  }

  async function cambiarEstadoConvocatoria(convocatoria: Convocatoria, estado: "Inactiva" | "Cerrada") {
    try {
      setCargando(true);
      setError("");
      if (estado === "Inactiva") {
        await desactivarConvocatoria(convocatoria.id_convocatoria);
        setMensaje("Convocatoria desactivada.");
      } else {
        await cerrarConvocatoria(convocatoria.id_convocatoria);
        setMensaje("Convocatoria cerrada.");
      }
      await cargarCatalogos();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo actualizar la convocatoria."));
    } finally {
      setCargando(false);
    }
  }

  const columnasGuia = tipoCarga === "alumnos" ? columnasAlumnos : columnasPersonal;
  const errores = resultadoValidacion?.errores ?? resultadoImportacion?.errores ?? [];
  const puedeImportar = Boolean(resultadoValidacion && resultadoValidacion.errores.length === 0);
  const resumenCalendario = obtenerResumenCalendario(convocatoriaForm);

  const catalogos = useMemo(
    () => [
      {
        titulo: "Carreras",
        descripcion: "Programas educativos registrados en la base de datos.",
        registros: carreras.length,
        icono: GraduationCap,
        tipo: "carreras" as CatalogoActivo,
      },
      {
        titulo: "Convocatorias",
        descripcion: "Periodos activos e historicos de practicas profesionales.",
        registros: convocatorias.length,
        icono: CalendarDays,
        tipo: "convocatorias" as CatalogoActivo,
      },
      {
        titulo: "Tipos de practica",
        descripcion: "Reglas academicas de semestre y creditos minimos.",
        registros: tiposPractica.length,
        icono: CheckCircle2,
        tipo: "tipos-practica" as CatalogoActivo,
      },
    ],
    [carreras.length, convocatorias.length, tiposPractica.length],
  );

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">Catalogos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Administracion de carreras, convocatorias y carga masiva.
          </p>
        </div>
        <button
          onClick={cargarCatalogos}
          disabled={cargando}
          className="border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${cargando ? "animate-spin" : ""}`} />
          Actualizar
        </button>
      </div>

      {mensaje && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-[#0d2b5e]">
          {mensaje}
        </div>
      )}

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {([
          ["Carreras registradas", carreras.length, Database, "bg-blue-600"],
          ["Convocatorias", convocatorias.length, CheckCircle2, "bg-green-600"],
          ["Carga masiva", resultadoImportacion?.importados ?? 0, FileSpreadsheet, "bg-orange-500"],
        ] satisfies ColoredStatCard[]).map(([titulo, valor, Icon, color]) => (
          <div key={titulo} className={`${color} rounded-2xl p-5 text-white`}>
            <Icon className="w-7 h-7 mb-3 opacity-80" />
            <div className="text-2xl font-bold">{cargando ? "..." : valor}</div>
            <div className="text-white/80 text-sm">{titulo}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[2fr_1fr] gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
            <div>
              <h3 className="font-bold text-[#0d2b5e]">Carga masiva</h3>
              <p className="text-sm text-gray-500 mt-1">
                Descarga la plantilla, valida el archivo, revisa la vista previa y confirma la importacion.
              </p>
            </div>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden text-sm">
              {(["alumnos", "personal"] as TipoCarga[]).map((tipo) => (
                <button
                  key={tipo}
                  onClick={() => reiniciarCarga(tipo)}
                  className={`px-4 py-2 font-semibold ${
                    tipoCarga === tipo ? "bg-[#1565c0] text-white" : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {tipo === "alumnos" ? "Alumnos" : "Personal"}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-6 grid md:grid-cols-3 gap-3">
            {[
              ["1", "Descargar plantilla"],
              ["2", "Subir y validar"],
              ["3", "Confirmar importacion"],
            ].map(([numero, texto]) => (
              <div key={numero} className="border border-gray-200 rounded-xl p-3 flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-blue-50 text-[#1565c0] flex items-center justify-center text-sm font-bold">
                  {numero}
                </span>
                <span className="text-sm font-semibold text-[#0d2b5e]">{texto}</span>
              </div>
            ))}
          </div>

          <div className="mt-6 border-2 border-dashed border-blue-200 rounded-2xl p-6 bg-blue-50/40">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="w-10 h-10 text-[#1565c0]" />
                <div>
                  <h4 className="font-bold text-[#0d2b5e]">
                    Archivo de {tipoCarga === "alumnos" ? "alumnos" : "personal"}
                  </h4>
                  <p className="text-sm text-gray-500">Formatos permitidos: .xlsx, .csv</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={descargarPlantillaExcel}
                  className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Descargar plantilla Excel
                </button>
              </div>
            </div>

            <div className="mt-5 grid md:grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-white border border-blue-100 p-3 text-[#0d2b5e]">
                La plantilla Excel incluye instrucciones y ejemplos en una sola hoja para facilitar el llenado.
              </div>
              <div className="rounded-xl bg-white border border-blue-100 p-3 text-[#0d2b5e]">
                El CSV es simple. Usa exactamente el orden de columnas mostrado.
              </div>
            </div>

            <div className="mt-3 rounded-xl bg-white border border-blue-100 p-3 text-sm text-[#0d2b5e]">
              <span className="font-semibold">Orden de columnas:</span>{" "}
              {(tipoCarga === "alumnos" ? columnasAlumnos : columnasPersonal).join(", ")}
            </div>

            <div className="mt-5 flex flex-col md:flex-row items-start md:items-center gap-3">
              <input
                type="file"
                accept=".xlsx,.csv"
                onChange={(event) => {
                  const seleccionado = event.target.files?.[0] ?? null;
                  const extension = seleccionado?.name.split(".").pop()?.toLowerCase();
                  if (seleccionado && extension !== "xlsx" && extension !== "csv") {
                    setArchivo(null);
                    setResultadoValidacion(null);
                    setResultadoImportacion(null);
                    setError("Formato no permitido. Sube un archivo .csv o .xlsx.");
                    event.target.value = "";
                    return;
                  }
                  setArchivo(seleccionado);
                  setResultadoValidacion(null);
                  setResultadoImportacion(null);
                  setError("");
                }}
                className="block w-full md:w-auto text-sm"
              />

              <button
                onClick={handleValidarArchivo}
                disabled={cargando || !archivo}
                className="bg-[#1565c0] text-white rounded-xl px-5 py-2 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
              >
                <Upload className="w-4 h-4" />
                Validar archivo
              </button>

              <button
                onClick={handleImportarArchivo}
                disabled={cargando || !puedeImportar}
                className="bg-green-600 text-white rounded-xl px-5 py-2 text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                Confirmar importacion
              </button>
            </div>
          </div>

          {resultadoValidacion && (
            <div className="mt-6 border rounded-xl p-4 bg-white">
              <h4 className="font-bold mb-3 text-[#0d2b5e] flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#1565c0]" />
                Vista previa y validacion
              </h4>
              <div className="grid md:grid-cols-3 gap-3 text-sm">
                <div>Total: {resultadoValidacion.total}</div>
                <div>Validos: {resultadoValidacion.validos}</div>
                <div>Errores: {resultadoValidacion.errores.length}</div>
              </div>

              {(resultadoValidacion.vista_previa?.length ?? 0) > 0 && (
                <div className="mt-4 overflow-x-auto border rounded-xl">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {Object.keys(resultadoValidacion.vista_previa?.[0] ?? {}).map((columna) => (
                          <th key={columna} className="px-3 py-2 text-left font-semibold text-gray-500">
                            {columna}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {resultadoValidacion.vista_previa?.map((fila, index) => (
                        <tr key={index} className="border-t">
                          {Object.values(fila).map((valor, celda) => (
                            <td key={celda} className="px-3 py-2 text-gray-700">
                              {String(valor ?? "")}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {errores.length > 0 && (
            <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center justify-between gap-3">
                <h4 className="font-bold text-red-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Errores por fila
                </h4>
                <button
                  onClick={descargarErrores}
                  className="bg-white border border-red-200 text-red-700 rounded-lg px-3 py-1.5 text-xs font-semibold"
                >
                  Descargar errores
                </button>
              </div>
              <div className="mt-3 space-y-2 max-h-52 overflow-y-auto">
                {errores.map((item) => (
                  <div key={`${item.fila}-${item.error}`} className="text-sm text-red-700">
                    Fila {item.fila}: {item.error}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(resultadoImportacion?.credenciales?.length ?? 0) > 0 && (
            <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <h4 className="font-bold text-yellow-800 flex items-center gap-2">
                <KeyRound className="w-4 h-4" />
                Credenciales temporales
              </h4>
              <p className="text-sm text-yellow-800 mt-2">
                Guarda este archivo ahora. Las contraseñas no podrán recuperarse después.
              </p>
              <button
                onClick={descargarCredenciales}
                className="mt-3 bg-yellow-600 text-white rounded-xl px-4 py-2 text-sm font-semibold inline-flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Descargar credenciales
              </button>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">Parametros requeridos</h3>
          <div className="space-y-3">
            {columnasGuia.map((campo) => (
              <div key={campo} className="flex items-center gap-2 text-sm">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span className="text-gray-700">{campo}</span>
              </div>
            ))}
          </div>
          {tipoCarga === "alumnos" && (
            <p className="text-xs text-gray-500 mt-4">
              El periodo no se captura por alumno: se toma automaticamente del tipo de periodo configurado en la carrera. Las contrasenas temporales solo se pueden descargar al finalizar la importacion.
            </p>
          )}
          {tipoCarga === "personal" && (
            <p className="text-xs text-gray-500 mt-4">
              Escribe el rol por nombre. No uses Alumno, Unidad Receptora, id_empresa ni id_rol. Las contrasenas temporales solo se pueden descargar al finalizar la importacion.
            </p>
          )}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {catalogos.map((catalogo) => (
          <div key={catalogo.titulo} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
            <catalogo.icono className="w-9 h-9 text-[#1565c0] mb-4" />
            <h3 className="font-bold text-[#0d2b5e]">{catalogo.titulo}</h3>
            <p className="text-sm text-gray-500 mt-2">{catalogo.descripcion}</p>
            <div className="mt-4 text-sm font-semibold text-[#1565c0]">
              {catalogo.registros} registros
            </div>
            <button
              onClick={() => abrirCatalogo(catalogo.tipo)}
              className="mt-5 w-full border border-blue-200 text-[#1565c0] rounded-xl py-2 text-sm font-semibold hover:bg-blue-50"
            >
              Administrar
            </button>
          </div>
        ))}
      </div>

      {catalogoActivo && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={cerrarModal}>
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-8"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-xl text-[#0d2b5e]">
                  {catalogoActivo === "carreras" && "Administrar carreras"}
                  {catalogoActivo === "convocatorias" && "Administrar convocatorias"}
                  {catalogoActivo === "tipos-practica" && "Administrar tipos de practica"}
                </h3>
                <p className="text-xs text-gray-500 mt-1">
                  Los cambios se guardan directamente en la base de datos.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setModoEdicion(false);
                    limpiarFormularios();
                  }}
                  className="border border-blue-200 text-[#1565c0] rounded-lg px-3 py-2 text-xs font-semibold flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Nuevo
                </button>
                <button onClick={cerrarModal} className="p-2 text-gray-400 hover:text-red-600">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {catalogoActivo === "carreras" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-[2fr_1fr_1fr_auto] gap-3">
                  <input
                    type="text"
                    placeholder="Nombre de la carrera"
                    value={carreraForm.nombre}
                    onChange={(event) => setCarreraForm({ ...carreraForm, nombre: event.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />
                  <select
                    value={carreraForm.tipo_periodo}
                    onChange={(event) => setCarreraForm({ ...carreraForm, tipo_periodo: event.target.value as Carrera["tipo_periodo"] })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white"
                  >
                    <option value="Semestral">Semestral</option>
                    <option value="Cuatrimestral">Cuatrimestral</option>
                  </select>
                  <select
                    value={carreraForm.estado}
                    onChange={(event) => setCarreraForm({ ...carreraForm, estado: event.target.value as Carrera["estado"] })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white"
                  >
                    <option value="Activa">Activa</option>
                    <option value="Inactiva">Inactiva</option>
                  </select>
                  <button onClick={guardarCarrera} disabled={cargando} className="bg-[#0d2b5e] text-white rounded-xl px-5 text-sm font-bold disabled:opacity-50">
                    {modoEdicion ? "Guardar cambios" : "Crear carrera"}
                  </button>
                </div>

                <div className="space-y-3">
                  {carreras.map((carrera) => (
                    <div key={carrera.id_carrera} className="border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-[#0d2b5e]">{carrera.nombre}</div>
                        <div className="text-xs text-[#1565c0] mt-1">{carrera.tipo_periodo}</div>
                        <div className="text-xs text-gray-500 mt-1">{carrera.estado}</div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setModoEdicion(true);
                            setCarreraForm(carrera);
                          }}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => eliminarItem("carreras", carrera.id_carrera)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Eliminar">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {catalogoActivo === "convocatorias" && (
              <div className="space-y-6">
                <div className="grid md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nombre"
                    value={convocatoriaForm.nombre}
                    onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, nombre: event.target.value })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />
                  <select
                    value={convocatoriaForm.tipo_periodo}
                    onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, tipo_periodo: event.target.value as Convocatoria["tipo_periodo"] })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white"
                  >
                    <option value="Semestral">Semestral</option>
                    <option value="Cuatrimestral">Cuatrimestral</option>
                  </select>
                  <select
                    value={convocatoriaForm.estado}
                    onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, estado: event.target.value as Convocatoria["estado"] })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white"
                  >
                    <option value="Activa">Activa</option>
                    <option value="Inactiva">Inactiva</option>
                    <option value="Cerrada">Cerrada</option>
                  </select>
                </div>

                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <div className="bg-gray-50 px-4 py-4 border-b border-gray-200">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div>
                        <h4 className="font-bold text-[#0d2b5e] flex items-center gap-2">
                          <CalendarDays className="w-4 h-4" />
                          Calendario por etapas
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Define las ventanas que habilitan cada modulo del proceso.
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${resumenCalendario.completo ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
                          {resumenCalendario.completo ? "Calendario completo" : "Calendario incompleto"}
                        </span>
                        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${resumenCalendario.flujoValido ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                          {resumenCalendario.flujoValido ? "Flujo valido" : "Flujo invalido"}
                        </span>
                      </div>
                    </div>
                    {resumenCalendario.error && (
                      <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {resumenCalendario.error}
                      </div>
                    )}
                  </div>

                  <div className="grid lg:grid-cols-2 gap-0">
                    {etapasConvocatoria.map((etapa) => {
                      const estadoEtapa = obtenerEstadoEtapa(convocatoriaForm, etapa);
                      const IconoEstado = estadoEtapa.icono;
                      return (
                        <div key={etapa.nombre} className="p-4 border-b border-gray-100 lg:odd:border-r">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 rounded-full bg-blue-50 text-[#1565c0] text-xs font-bold flex items-center justify-center">
                                  {etapa.orden}
                                </span>
                                <div className="font-bold text-sm text-[#0d2b5e]">{etapa.nombre}</div>
                              </div>
                              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{etapa.descripcion}</p>
                            </div>
                            <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border ${estadoEtapa.clase}`}>
                              <IconoEstado className="w-3 h-3" />
                              {estadoEtapa.texto}
                            </span>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-3 mt-4">
                            <label className="block">
                              <span className="text-[11px] font-semibold text-gray-500 uppercase">Fecha inicio</span>
                              <input
                                type="date"
                                required
                                aria-label={`Inicio ${etapa.nombre}`}
                                value={(convocatoriaForm[etapa.inicioCampo] as string | null) ?? ""}
                                onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, [etapa.inicioCampo]: event.target.value || null })}
                                className="mt-1 w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm"
                              />
                            </label>
                            <label className="block">
                              <span className="text-[11px] font-semibold text-gray-500 uppercase">Fecha cierre</span>
                              <input
                                type="date"
                                required
                                aria-label={`Cierre ${etapa.nombre}`}
                                value={(convocatoriaForm[etapa.cierreCampo] as string | null) ?? ""}
                                onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, [etapa.cierreCampo]: event.target.value || null })}
                                className="mt-1 w-full px-3 py-2.5 border-2 border-gray-200 rounded-lg text-sm"
                              />
                            </label>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <textarea
                  value={convocatoriaForm.observaciones ?? ""}
                  onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, observaciones: event.target.value })}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  placeholder="Observaciones"
                  rows={3}
                />

                <button onClick={guardarConvocatoria} disabled={cargando} className="w-full bg-[#0d2b5e] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-50">
                  {modoEdicion ? "Guardar cambios" : "Crear convocatoria"}
                </button>

                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-[#0d2b5e]">
                  Cada convocatoria aplica a un solo tipo de periodo. Si necesitas ambos procesos, crea una convocatoria Semestral y otra Cuatrimestral.
                </div>

                <div className="space-y-3">
                  {convocatorias.map((convocatoria) => (
                    <div key={convocatoria.id_convocatoria} className="border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-[#0d2b5e]">{convocatoria.nombre}</div>
                        <div className="text-xs text-gray-400">
                          General: {fechaTexto(convocatoria.fecha_inicio_general)} - {fechaTexto(convocatoria.fecha_cierre_general)}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="text-xs text-green-600">{convocatoria.estado}</span>
                          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-[#1565c0] font-semibold">
                            {convocatoria.tipo_periodo}
                          </span>
                          <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                            {convocatoria.fase_actual}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-wrap justify-end gap-2">
                        <button
                          onClick={() => {
                            setModoEdicion(true);
                            setConvocatoriaForm(convocatoria);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => cambiarEstadoConvocatoria(convocatoria, "Inactiva")}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-100 rounded-lg"
                          title="Desactivar"
                        >
                          <Power className="w-4 h-4" />
                          Desactivar
                        </button>
                        <button
                          onClick={() => cambiarEstadoConvocatoria(convocatoria, "Cerrada")}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-amber-700 hover:bg-amber-50 rounded-lg"
                          title="Cerrar"
                        >
                          <Archive className="w-4 h-4" />
                          Cerrar
                        </button>
                        <button
                          onClick={() => eliminarConvocatoriaAdmin(convocatoria)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {catalogoActivo === "tipos-practica" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-[#0d2b5e]">
                  Los tipos de practica definen el semestre y creditos minimos que un alumno debe cumplir para iniciar su proceso.
                </div>

                <div className="grid md:grid-cols-6 gap-3 border rounded-xl p-4">
                    <input
                      type="text"
                      value={tipoPracticaForm.nombre}
                      onChange={(event) => setTipoPracticaForm({ ...tipoPracticaForm, nombre: event.target.value })}
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                      placeholder="Nombre"
                    />
                    <input
                      type="number"
                      min={1}
                      value={tipoPracticaForm.semestre_requerido ?? ""}
                      onChange={(event) => setTipoPracticaForm({ ...tipoPracticaForm, semestre_requerido: Number(event.target.value) || null })}
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                      placeholder="Semestre requerido"
                    />
                    <input
                      type="number"
                      min={0}
                      value={tipoPracticaForm.creditos_minimos ?? ""}
                      onChange={(event) => setTipoPracticaForm({ ...tipoPracticaForm, creditos_minimos: Number(event.target.value) || 0 })}
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                      placeholder="Creditos minimos"
                    />
                    <input
                      type="number"
                      min={1}
                      value={tipoPracticaForm.horas_requeridas ?? ""}
                      onChange={(event) => setTipoPracticaForm({ ...tipoPracticaForm, horas_requeridas: Number(event.target.value) || null })}
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                      placeholder="Horas requeridas"
                    />
                    <input
                      type="number"
                      min={1}
                      value={tipoPracticaForm.orden ?? ""}
                      onChange={(event) => setTipoPracticaForm({ ...tipoPracticaForm, orden: Number(event.target.value) || null })}
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                      placeholder="Orden"
                    />
                    <select
                      value={tipoPracticaForm.activo ? "1" : "0"}
                      onChange={(event) => setTipoPracticaForm({ ...tipoPracticaForm, activo: event.target.value === "1" })}
                      className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white"
                    >
                      <option value="1">Activo</option>
                      <option value="0">Inactivo</option>
                    </select>
                    <button onClick={guardarTipoPractica} disabled={cargando} className="md:col-span-6 bg-[#0d2b5e] text-white rounded-xl py-3 text-sm font-bold disabled:opacity-50">
                      {modoEdicion ? "Guardar tipo de practica" : "Crear tipo de practica"}
                    </button>
                  </div>

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Tipo de practica", "Semestre requerido", "Creditos minimos", "Horas", "Orden", "Estado", "Acciones"].map((titulo) => (
                          <th key={titulo} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase">
                            {titulo}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {tiposPractica.map((tipo) => (
                        <tr key={tipo.id_tipo_practica}>
                          <td className="px-4 py-3 font-semibold text-[#0d2b5e]">{tipo.nombre}</td>
                          <td className="px-4 py-3">{tipo.semestre_requerido ?? "Sin definir"}</td>
                          <td className="px-4 py-3">{tipo.creditos_minimos ?? 0}</td>
                          <td className="px-4 py-3">{tipo.horas_requeridas ?? 0}</td>
                          <td className="px-4 py-3">{tipo.orden ?? "Sin definir"}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full font-semibold ${tipo.activo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                              {tipo.activo ? "Activo" : "Inactivo"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => {
                                setModoEdicion(true);
                                setTipoPracticaForm(tipo);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Editar"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
