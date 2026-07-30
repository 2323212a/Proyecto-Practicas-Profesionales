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
  actualizarReglaPracticaCarrera,
  actualizarTipoPractica,
  activarReglaPracticaCarrera,
  cerrarConvocatoria,
  crearCarrera,
  crearConvocatoria,
  crearReglaPracticaCarrera,
  crearTipoPractica,
  desactivarConvocatoria,
  desactivarReglaPracticaCarrera,
  eliminarCarrera,
  eliminarConvocatoria,
  importarAlumnosMasivo,
  importarPersonalMasivo,
  obtenerCarreras,
  obtenerConvocatorias,
  obtenerReglasPracticaCarrera,
  obtenerTiposPractica,
  validarAlumnosMasivo,
  validarPersonalMasivo,
} from "../../../infrastructure/catalogos/catalogosApi";

import type { ColoredStatCard } from "../../../shared/types/ui";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

type CatalogoActivo = "carreras" | "convocatorias" | "tipos-practica" | "reglas-practica" | null;
type TipoCarga = "alumnos" | "personal";

type Carrera = {
  id_carrera: number;
  nombre: string;
  tipo_periodo: "Semestral" | "Cuatrimestral";
  duracion_periodos: number | null;
  creditos_totales: number | null;
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

type ReglaPracticaCarrera = {
  id_regla_practica_carrera: number;
  id_carrera: number;
  carrera_nombre: string | null;
  carrera_tipo_periodo: "Semestral" | "Cuatrimestral" | null;
  carrera_duracion_periodos: number | null;
  carrera_creditos_totales: number | null;
  id_tipo_practica: number;
  tipo_practica_nombre: string | null;
  periodo_requerido: number;
  creditos_minimos: number;
  horas_requeridas: number;
  activo: boolean;
  observaciones: string | null;
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
  duracion_periodos: null,
  creditos_totales: null,
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

const reglaPracticaInicial: ReglaPracticaCarrera = {
  id_regla_practica_carrera: 0,
  id_carrera: 0,
  carrera_nombre: null,
  carrera_tipo_periodo: null,
  carrera_duracion_periodos: null,
  carrera_creditos_totales: null,
  id_tipo_practica: 0,
  tipo_practica_nombre: null,
  periodo_requerido: 1,
  creditos_minimos: 0,
  horas_requeridas: 480,
  activo: true,
  observaciones: "",
};

type EtapaConvocatoria = {
  orden: number;
  nombre: string;
  descripcion: string;
  habilita?: string;
  fueraFecha?: string;
  nota?: string;
  inicioCampo: keyof Convocatoria;
  cierreCampo: keyof Convocatoria;
};

type CampoFechaConvocatoria = EtapaConvocatoria["inicioCampo"] | EtapaConvocatoria["cierreCampo"];

type BloqueConvocatoria = {
  orden: number;
  nombre: string;
  descripcion: string;
  nota?: string;
  inicioCampo: CampoFechaConvocatoria;
  cierreCampo: CampoFechaConvocatoria;
  etapas: Array<{ inicioCampo: CampoFechaConvocatoria; cierreCampo: CampoFechaConvocatoria }>;
};

type EstadoFecha = "valida" | "incompleta" | "conflicto";

type ValidacionFecha = {
  estado: EstadoFecha;
  mensaje: string;
  min?: string;
  max?: string;
};

const etapasConvocatoria: EtapaConvocatoria[] = [
  {
    orden: 1,
    nombre: "General",
    descripcion: "Periodo total de la convocatoria.",
    inicioCampo: "fecha_inicio_general",
    cierreCampo: "fecha_cierre_general",
  },
  {
    orden: 2,
    nombre: "Empresas",
    descripcion: "Registro de participacion y vacantes.",
    inicioCampo: "fecha_inicio_empresas",
    cierreCampo: "fecha_cierre_empresas",
  },
  {
    orden: 3,
    nombre: "Documentos",
    descripcion: "Inscripcion y carga documental.",
    inicioCampo: "fecha_inicio_documentos",
    cierreCampo: "fecha_cierre_documentos",
  },
  {
    orden: 4,
    nombre: "Validacion",
    descripcion: "Revisión documental por coordinacion.",
    inicioCampo: "fecha_inicio_validacion",
    cierreCampo: "fecha_cierre_validacion",
  },
  {
    orden: 5,
    nombre: "Seleccion",
    descripcion: "Eleccion de vacantes del padron publicado.",
    habilita:
      "Alumno puede seleccionar opciones de empresa/vacante unicamente si el padron ya fue liberado por Coordinacion de Unidades Receptoras.",
    fueraFecha: "El alumno no puede registrar ni modificar su seleccion.",
    nota:
      "Las vacantes en PrePadron no son visibles para alumnos hasta que Coordinacion de Unidades Receptoras libere el padron.",
    inicioCampo: "fecha_inicio_seleccion",
    cierreCampo: "fecha_cierre_seleccion",
  },
  {
    orden: 6,
    nombre: "Asignacion",
    descripcion: "Asignacion formal de alumnos.",
    inicioCampo: "fecha_inicio_asignacion",
    cierreCampo: "fecha_cierre_asignacion",
  },
  {
    orden: 7,
    nombre: "Practicas",
    descripcion: "Reportes, horas y seguimiento.",
    inicioCampo: "fecha_inicio_practicas",
    cierreCampo: "fecha_cierre_practicas",
  },
  {
    orden: 8,
    nombre: "Cierre",
    descripcion: "Liberacion y cierre administrativo.",
    inicioCampo: "fecha_inicio_cierre",
    cierreCampo: "fecha_cierre_cierre",
  },
];

const bloquesConvocatoria: BloqueConvocatoria[] = [
  {
    orden: 1,
    nombre: "Registro y preparación",
    descripcion: "Registro de empresas, carga documental y validación inicial.",
    inicioCampo: "fecha_inicio_empresas",
    cierreCampo: "fecha_cierre_validacion",
    etapas: [
      { inicioCampo: "fecha_inicio_empresas", cierreCampo: "fecha_cierre_empresas" },
      { inicioCampo: "fecha_inicio_documentos", cierreCampo: "fecha_cierre_documentos" },
      { inicioCampo: "fecha_inicio_validacion", cierreCampo: "fecha_cierre_validacion" },
    ],
  },
  {
    orden: 2,
    nombre: "Selección y asignación",
    descripcion: "Selección de vacantes, asignación formal y atención de alumnos rezagados.",
    nota: "Incluye atención de alumnos rezagados mediante reasignación extraordinaria.",
    inicioCampo: "fecha_inicio_seleccion",
    cierreCampo: "fecha_cierre_asignacion",
    etapas: [
      { inicioCampo: "fecha_inicio_seleccion", cierreCampo: "fecha_cierre_seleccion" },
      { inicioCampo: "fecha_inicio_asignacion", cierreCampo: "fecha_cierre_asignacion" },
    ],
  },
  {
    orden: 3,
    nombre: "Desarrollo de prácticas",
    descripcion: "Prácticas, horas, reportes, seguimiento, incidencias y reasignaciones extraordinarias.",
    nota: "Permite seguimiento, incidencias y cambios extraordinarios de empresa cuando sean autorizados.",
    inicioCampo: "fecha_inicio_practicas",
    cierreCampo: "fecha_cierre_practicas",
    etapas: [
      { inicioCampo: "fecha_inicio_practicas", cierreCampo: "fecha_cierre_practicas" },
    ],
  },
  {
    orden: 4,
    nombre: "Cierre",
    descripcion: "Evaluaciones, liberación y cierre administrativo.",
    inicioCampo: "fecha_inicio_cierre",
    cierreCampo: "fecha_cierre_cierre",
    etapas: [
      { inicioCampo: "fecha_inicio_cierre", cierreCampo: "fecha_cierre_cierre" },
    ],
  },
];

function desplazarFechaDias(fecha: string, dias: number) {
  const valor = new Date(`${fecha}T12:00:00`);
  valor.setDate(valor.getDate() + dias);
  return valor.toISOString().slice(0, 10);
}

function distribuirFechasBloque(
  form: Convocatoria,
  bloque: BloqueConvocatoria,
  inicio: string | null,
  cierre: string | null
): Convocatoria {
  const siguiente: Convocatoria = { ...form };
  siguiente[bloque.inicioCampo] = inicio as never;
  siguiente[bloque.cierreCampo] = cierre as never;
  if (!inicio || !cierre || inicio > cierre) return siguiente;

  const inicioFecha = new Date(`${inicio}T12:00:00`);
  const cierreFecha = new Date(`${cierre}T12:00:00`);
  const dias = Math.round((cierreFecha.getTime() - inicioFecha.getTime()) / 86_400_000);
  const cantidad = bloque.etapas.length;

  bloque.etapas.forEach((etapa, indice) => {
    const inicioOffset = Math.floor((indice * dias) / cantidad);
    const cierreOffset = Math.floor(((indice + 1) * dias) / cantidad);
    siguiente[etapa.inicioCampo] = desplazarFechaDias(inicio, inicioOffset) as never;
    siguiente[etapa.cierreCampo] = desplazarFechaDias(inicio, cierreOffset) as never;
  });
  return siguiente;
}

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

function obtenerConflictosMismoTipo(form: Convocatoria, convocatorias: Convocatoria[]) {
  if (
    form.estado !== "Activa" ||
    !form.fecha_inicio_general ||
    !form.fecha_cierre_general
  ) {
    return [];
  }

  return convocatorias.filter((convocatoria) => {
    if (convocatoria.id_convocatoria === form.id_convocatoria) return false;
    if (convocatoria.estado !== "Activa") return false;
    if (convocatoria.tipo_periodo !== form.tipo_periodo) return false;
    if (!convocatoria.fecha_inicio_general || !convocatoria.fecha_cierre_general) return false;
    return (
      form.fecha_inicio_general! <= convocatoria.fecha_cierre_general &&
      form.fecha_cierre_general! >= convocatoria.fecha_inicio_general
    );
  });
}

function obtenerEtapaPorCampo(campo: CampoFechaConvocatoria) {
  return etapasConvocatoria.find((etapa) => etapa.inicioCampo === campo || etapa.cierreCampo === campo);
}

function obtenerEtapaAnterior(etapa: EtapaConvocatoria) {
  return etapasConvocatoria.find((item) => item.orden === etapa.orden - 1);
}

function obtenerFechaMinimaCampo(campo: CampoFechaConvocatoria, form: Convocatoria) {
  const etapa = obtenerEtapaPorCampo(campo);
  if (!etapa) return undefined;

  if (campo === "fecha_cierre_general") return form.fecha_inicio_general ?? undefined;
  if (campo === "fecha_inicio_general") return undefined;
  if (campo === etapa.cierreCampo) return (form[etapa.inicioCampo] as string | null) ?? undefined;

  if (etapa.orden === 2) return form.fecha_inicio_general ?? undefined;
  const etapaAnterior = obtenerEtapaAnterior(etapa);
  return etapaAnterior ? ((form[etapaAnterior.cierreCampo] as string | null) ?? undefined) : undefined;
}

function obtenerFechaMaximaCampo(campo: CampoFechaConvocatoria, form: Convocatoria) {
  const etapa = obtenerEtapaPorCampo(campo);
  if (!etapa) return undefined;

  if (campo === "fecha_inicio_general") return form.fecha_cierre_general ?? undefined;
  if (campo === "fecha_cierre_general") return undefined;
  if (campo === etapa.inicioCampo) return ((form[etapa.cierreCampo] as string | null) ?? form.fecha_cierre_general ?? undefined);
  return form.fecha_cierre_general ?? undefined;
}

function validarCampoFecha(
  campo: CampoFechaConvocatoria,
  valor: string | null,
  form: Convocatoria,
  convocatorias: Convocatoria[]
): ValidacionFecha {
  const min = obtenerFechaMinimaCampo(campo, form);
  const max = obtenerFechaMaximaCampo(campo, form);
  const etapa = obtenerEtapaPorCampo(campo);

  if (!valor || !etapa) {
    return { estado: "incompleta", mensaje: "Fecha pendiente.", min, max };
  }

  const inicioEtapa = form[etapa.inicioCampo] as string | null;
  const cierreEtapa = form[etapa.cierreCampo] as string | null;

  if (campo === etapa.cierreCampo && inicioEtapa && valor < inicioEtapa) {
    return { estado: "conflicto", mensaje: "El cierre no puede ser anterior al inicio.", min, max };
  }

  if (campo === etapa.inicioCampo && cierreEtapa && valor > cierreEtapa) {
    return { estado: "conflicto", mensaje: "El cierre no puede ser anterior al inicio.", min, max };
  }

  if (min && valor < min) {
    const mensaje =
      campo === etapa.inicioCampo
        ? "Esta etapa no puede iniciar antes de que termine la etapa anterior."
        : "El cierre no puede ser anterior al inicio.";
    return { estado: "conflicto", mensaje, min, max };
  }

  if (max && valor > max) {
    return { estado: "conflicto", mensaje: "La etapa debe estar dentro del periodo general.", min, max };
  }

  if (etapa.orden > 1) {
    if (form.fecha_inicio_general && valor < form.fecha_inicio_general) {
      return { estado: "conflicto", mensaje: "La etapa debe estar dentro del periodo general.", min, max };
    }
    if (form.fecha_cierre_general && valor > form.fecha_cierre_general) {
      return { estado: "conflicto", mensaje: "La etapa debe estar dentro del periodo general.", min, max };
    }
  }

  if (
    (campo === "fecha_inicio_general" || campo === "fecha_cierre_general") &&
    obtenerConflictosMismoTipo(form, convocatorias).length > 0
  ) {
    return {
      estado: "conflicto",
      mensaje: "Existe una convocatoria del mismo tipo de periodo que se cruza con estas fechas.",
      min,
      max,
    };
  }

  return { estado: "valida", mensaje: "Fecha valida.", min, max };
}

function obtenerClaseInputFecha(validacion: ValidacionFecha) {
  if (validacion.estado === "valida") return "border-green-300 bg-green-50/70 text-green-900 focus:border-green-500";
  if (validacion.estado === "conflicto") return "border-red-300 bg-red-50/70 text-red-900 focus:border-red-500";
  return "border-yellow-200 bg-yellow-50/40 text-gray-700 focus:border-yellow-400";
}

function obtenerClaseMensajeFecha(validacion: ValidacionFecha) {
  if (validacion.estado === "valida") return "text-green-700";
  if (validacion.estado === "conflicto") return "text-red-700";
  return "text-yellow-700";
}

function obtenerEstadoEtapa(form: Convocatoria, etapa: EtapaConvocatoria, convocatorias: Convocatoria[]) {
  const inicio = form[etapa.inicioCampo] as string | null;
  const cierre = form[etapa.cierreCampo] as string | null;
  if (!inicio || !cierre) {
    return {
      texto: "Incompleta",
      clase: "bg-yellow-50 text-yellow-700 border-yellow-200",
      icono: AlertTriangle,
    };
  }
  const validacionInicio = validarCampoFecha(etapa.inicioCampo, inicio, form, convocatorias);
  const validacionCierre = validarCampoFecha(etapa.cierreCampo, cierre, form, convocatorias);
  if (validacionInicio.estado === "conflicto" || validacionCierre.estado === "conflicto") {
    return {
      texto: "Conflicto",
      clase: "bg-red-50 text-red-700 border-red-200",
      icono: AlertTriangle,
    };
  }
  return {
    texto: "Valida",
    clase: "bg-green-50 text-green-700 border-green-200",
    icono: CheckCircle2,
  };
}

type ClaveTipoPractica = "practicas_1" | "practicas_2" | "residencia";

function normalizarTexto(valor?: string | null) {
  return (valor ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function obtenerClaveTipoPractica(nombre?: string | null): ClaveTipoPractica | null {
  const texto = normalizarTexto(nombre);
  if (texto.includes("residencia")) return "residencia";
  if (texto.includes("practica") && texto.includes("1")) return "practicas_1";
  if (texto.includes("practica") && texto.includes("2")) return "practicas_2";
  return null;
}

function obtenerErroresSecuenciaRegla(
  regla: Pick<ReglaPracticaCarrera, "id_regla_practica_carrera" | "id_carrera" | "id_tipo_practica" | "periodo_requerido" | "activo" | "tipo_practica_nombre">,
  reglas: ReglaPracticaCarrera[],
  tipos: TipoPractica[],
) {
  if (!regla.activo) return [];
  const tipoActual = tipos.find((tipo) => tipo.id_tipo_practica === regla.id_tipo_practica);
  const claveActual = obtenerClaveTipoPractica(regla.tipo_practica_nombre ?? tipoActual?.nombre);
  if (!claveActual) return [];

  const periodos: Partial<Record<ClaveTipoPractica, number>> = {
    [claveActual]: regla.periodo_requerido,
  };

  reglas
    .filter(
      (item) =>
        item.activo &&
        item.id_carrera === regla.id_carrera &&
        item.id_regla_practica_carrera !== regla.id_regla_practica_carrera,
    )
    .forEach((item) => {
      const tipo = tipos.find((tipoPractica) => tipoPractica.id_tipo_practica === item.id_tipo_practica);
      const clave = obtenerClaveTipoPractica(item.tipo_practica_nombre ?? tipo?.nombre);
      if (clave) periodos[clave] = item.periodo_requerido;
    });

  const practica1 = periodos.practicas_1;
  const practica2 = periodos.practicas_2;
  const residencia = periodos.residencia;
  const errores: string[] = [];

  if (practica1 !== undefined && practica2 !== undefined && practica2 <= practica1) {
    errores.push("Practicas 2 debe ubicarse despues de Practicas 1.");
  }
  if (practica1 !== undefined && residencia !== undefined && residencia <= practica1) {
    errores.push("Residencia debe ubicarse despues de Practicas 1.");
  }
  if (practica2 !== undefined && residencia !== undefined && residencia <= practica2) {
    errores.push("Residencia debe ubicarse despues de Practicas 2.");
  }

  return errores;
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

function desplazarFechaAnios(fecha?: string | null, anios = 1) {
  if (!fecha) return null;
  const [anio, mes, dia] = fecha.split("-").map(Number);
  if (!anio || !mes || !dia) return fecha;
  const siguienteAnio = anio + anios;
  const ultimoDiaMes = new Date(siguienteAnio, mes, 0).getDate();
  const diaSeguro = Math.min(dia, ultimoDiaMes);
  return `${siguienteAnio}-${String(mes).padStart(2, "0")}-${String(diaSeguro).padStart(2, "0")}`;
}

function sugerirNombreSiguienteCiclo(nombre: string, fechaInicio?: string | null) {
  const anioBase = fechaInicio ? Number(fechaInicio.slice(0, 4)) : new Date().getFullYear();
  const anioSiguiente = anioBase + 1;
  if (/\b(20\d{2}|19\d{2})\b/.test(nombre)) {
    return nombre.replace(/\b(20\d{2}|19\d{2})\b/g, (anio) => String(Number(anio) + 1));
  }
  return `${nombre} ${anioSiguiente}`;
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
  const [reglasPractica, setReglasPractica] = useState<ReglaPracticaCarrera[]>([]);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [tipoCarga, setTipoCarga] = useState<TipoCarga>("alumnos");
  const [resultadoValidacion, setResultadoValidacion] = useState<ResultadoValidacion | null>(null);
  const [resultadoImportacion, setResultadoImportacion] = useState<ResultadoImportacion | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");
  const [catalogoActivo, setCatalogoActivo] = useState<CatalogoActivo>(null);
  const [modoEdicion, setModoEdicion] = useState(false);
  const [modoAvanzadoConvocatoria, setModoAvanzadoConvocatoria] = useState(false);
  const [carreraForm, setCarreraForm] = useState<Carrera>(carreraInicial);
  const [convocatoriaForm, setConvocatoriaForm] = useState<Convocatoria>(convocatoriaInicial);
  const [tipoPracticaForm, setTipoPracticaForm] = useState<TipoPractica>(tipoPracticaInicial);
  const [reglaPracticaForm, setReglaPracticaForm] = useState<ReglaPracticaCarrera>(reglaPracticaInicial);

  useEffect(() => {
    void cargarCatalogos();
  }, []);

  async function cargarCatalogos() {
    try {
      setCargando(true);
      setError("");
      const [carrerasData, convocatoriasData, tiposPracticaData, reglasPracticaData] = await Promise.all([
        obtenerCarreras(),
        obtenerConvocatorias(),
        obtenerTiposPractica(),
        obtenerReglasPracticaCarrera(),
      ]);
      setCarreras(carrerasData);
      setConvocatorias(convocatoriasData);
      setTiposPractica(tiposPracticaData);
      setReglasPractica(reglasPracticaData);
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
    setReglaPracticaForm(reglaPracticaInicial);
    setModoAvanzadoConvocatoria(false);
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
      const datosCarrera = {
        nombre: carreraForm.nombre.trim(),
        tipo_periodo: carreraForm.tipo_periodo,
        duracion_periodos: carreraForm.duracion_periodos,
        creditos_totales: carreraForm.creditos_totales,
        estado: carreraForm.estado,
      };
      if (modoEdicion) {
        await actualizarCarrera(carreraForm.id_carrera, datosCarrera);
        setMensaje("Carrera actualizada.");
      } else {
        await crearCarrera(datosCarrera);
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

    if (obtenerConflictosMismoTipo(convocatoriaForm, convocatorias).length > 0) {
      setError("Existe una convocatoria del mismo tipo de periodo que se cruza con estas fechas.");
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

  async function guardarReglaPractica() {
    if (reglaPracticaBloqueada) {
      setError("Completa la regla y revisa que no supere la duracion o creditos de la carrera.");
      return;
    }

    const data = {
      periodo_requerido: reglaPracticaForm.periodo_requerido,
      creditos_minimos: reglaPracticaForm.creditos_minimos,
      horas_requeridas: reglaPracticaForm.horas_requeridas,
      activo: reglaPracticaForm.activo,
      observaciones: reglaPracticaForm.observaciones?.trim() || null,
    };

    try {
      setCargando(true);
      setError("");
      if (modoEdicion && reglaPracticaForm.id_regla_practica_carrera) {
        await actualizarReglaPracticaCarrera(reglaPracticaForm.id_regla_practica_carrera, data);
        setMensaje("Regla de practica actualizada.");
      } else {
        await crearReglaPracticaCarrera({
          id_carrera: reglaPracticaForm.id_carrera,
          id_tipo_practica: reglaPracticaForm.id_tipo_practica,
          ...data,
        });
        setMensaje("Regla de practica creada.");
      }
      setModoEdicion(false);
      setReglaPracticaForm(reglaPracticaInicial);
      await cargarCatalogos();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo guardar la regla de practica."));
    } finally {
      setCargando(false);
    }
  }

  async function cambiarEstadoReglaPractica(regla: ReglaPracticaCarrera, activo: boolean) {
    try {
      setCargando(true);
      setError("");
      if (activo) {
        await activarReglaPracticaCarrera(regla.id_regla_practica_carrera);
        setMensaje("Regla activada.");
      } else {
        await desactivarReglaPracticaCarrera(regla.id_regla_practica_carrera);
        setMensaje("Regla desactivada.");
      }
      await cargarCatalogos();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No se pudo cambiar el estado de la regla."));
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

  function repetirCicloConvocatoria(convocatoria: Convocatoria) {
    setModoEdicion(false);
    setModoAvanzadoConvocatoria(false);
    setConvocatoriaForm({
      ...convocatoria,
      id_convocatoria: 0,
      nombre: sugerirNombreSiguienteCiclo(convocatoria.nombre, convocatoria.fecha_inicio_general),
      estado: "Inactiva",
      fecha_inicio_general: desplazarFechaAnios(convocatoria.fecha_inicio_general),
      fecha_cierre_general: desplazarFechaAnios(convocatoria.fecha_cierre_general),
      fecha_inicio_empresas: desplazarFechaAnios(convocatoria.fecha_inicio_empresas),
      fecha_cierre_empresas: desplazarFechaAnios(convocatoria.fecha_cierre_empresas),
      fecha_inicio_documentos: desplazarFechaAnios(convocatoria.fecha_inicio_documentos),
      fecha_cierre_documentos: desplazarFechaAnios(convocatoria.fecha_cierre_documentos),
      fecha_inicio_validacion: desplazarFechaAnios(convocatoria.fecha_inicio_validacion),
      fecha_cierre_validacion: desplazarFechaAnios(convocatoria.fecha_cierre_validacion),
      fecha_inicio_seleccion: desplazarFechaAnios(convocatoria.fecha_inicio_seleccion),
      fecha_cierre_seleccion: desplazarFechaAnios(convocatoria.fecha_cierre_seleccion),
      fecha_inicio_asignacion: desplazarFechaAnios(convocatoria.fecha_inicio_asignacion),
      fecha_cierre_asignacion: desplazarFechaAnios(convocatoria.fecha_cierre_asignacion),
      fecha_inicio_practicas: desplazarFechaAnios(convocatoria.fecha_inicio_practicas),
      fecha_cierre_practicas: desplazarFechaAnios(convocatoria.fecha_cierre_practicas),
      fecha_inicio_cierre: desplazarFechaAnios(convocatoria.fecha_inicio_cierre),
      fecha_cierre_cierre: desplazarFechaAnios(convocatoria.fecha_cierre_cierre),
      fase_actual: "Programada",
    });
    setMensaje("Vista previa generada. Revisa el calendario y confirma con Crear convocatoria.");
    setError("");
  }

  const columnasGuia = tipoCarga === "alumnos" ? columnasAlumnos : columnasPersonal;
  const errores = resultadoValidacion?.errores ?? resultadoImportacion?.errores ?? [];
  const puedeImportar = Boolean(resultadoValidacion && resultadoValidacion.errores.length === 0);
  const resumenCalendario = obtenerResumenCalendario(convocatoriaForm);
  const conflictosMismoTipo = obtenerConflictosMismoTipo(convocatoriaForm, convocatorias);
  const tipoPeriodoPlural = convocatoriaForm.tipo_periodo === "Semestral" ? "semestrales" : "cuatrimestrales";
  const validacionesFechasConvocatoria = etapasConvocatoria.flatMap((etapa) => [
    validarCampoFecha(etapa.inicioCampo, convocatoriaForm[etapa.inicioCampo] as string | null, convocatoriaForm, convocatorias),
    validarCampoFecha(etapa.cierreCampo, convocatoriaForm[etapa.cierreCampo] as string | null, convocatoriaForm, convocatorias),
  ]);
  const calendarioTieneConflictos = validacionesFechasConvocatoria.some((validacion) => validacion.estado === "conflicto");
  const guardarConvocatoriaBloqueado = cargando || Boolean(resumenCalendario.error) || calendarioTieneConflictos;
  const carreraReglaSeleccionada = carreras.find((carrera) => carrera.id_carrera === reglaPracticaForm.id_carrera);
  const tipoReglaSeleccionado = tiposPractica.find((tipo) => tipo.id_tipo_practica === reglaPracticaForm.id_tipo_practica);
  const etiquetaPeriodoCarreraForm = carreraForm.tipo_periodo === "Cuatrimestral" ? "Duracion en cuatrimestres" : "Duracion en semestres";
  const etiquetaPeriodoRegla = carreraReglaSeleccionada?.tipo_periodo === "Cuatrimestral" ? "Cuatrimestre requerido" : "Semestre requerido";
  const unidadPeriodoRegla = carreraReglaSeleccionada?.tipo_periodo === "Cuatrimestral" ? "cuatrimestre" : "semestre";
  const limitePeriodoRegla = carreraReglaSeleccionada?.duracion_periodos ?? null;
  const limiteCreditosRegla = carreraReglaSeleccionada?.creditos_totales ?? null;
  const periodosRestantesRegla = limitePeriodoRegla !== null ? limitePeriodoRegla - reglaPracticaForm.periodo_requerido : null;
  const tiposPracticaActivos = tiposPractica.filter((tipo) => tipo.activo);
  const reglaExistenteMismaClave = reglasPractica.find(
    (regla) =>
      regla.id_carrera === reglaPracticaForm.id_carrera &&
      regla.id_tipo_practica === reglaPracticaForm.id_tipo_practica &&
      regla.id_regla_practica_carrera !== reglaPracticaForm.id_regla_practica_carrera,
  );
  const erroresReglaPractica = [
    !reglaPracticaForm.id_carrera ? "Selecciona una carrera para configurar sus requisitos especificos." : null,
    !reglaPracticaForm.id_tipo_practica ? "Selecciona un tipo de practica." : null,
    reglaPracticaForm.periodo_requerido < 1 ? "El periodo requerido debe ser mayor o igual a 1." : null,
    limitePeriodoRegla !== null && reglaPracticaForm.periodo_requerido > limitePeriodoRegla
      ? `El ${carreraReglaSeleccionada?.tipo_periodo === "Cuatrimestral" ? "cuatrimestre" : "semestre"} requerido no puede ser mayor a la duracion de la carrera.`
      : null,
    reglaPracticaForm.creditos_minimos < 0 ? "Los creditos minimos no pueden ser negativos." : null,
    limiteCreditosRegla !== null && reglaPracticaForm.creditos_minimos > limiteCreditosRegla
      ? "Los creditos minimos no pueden superar los creditos totales de la carrera."
      : null,
    reglaPracticaForm.horas_requeridas <= 0 ? "Las horas requeridas deben ser mayores a cero." : null,
    ...obtenerErroresSecuenciaRegla(
      {
        id_regla_practica_carrera: reglaPracticaForm.id_regla_practica_carrera,
        id_carrera: reglaPracticaForm.id_carrera,
        id_tipo_practica: reglaPracticaForm.id_tipo_practica,
        periodo_requerido: reglaPracticaForm.periodo_requerido,
        activo: reglaPracticaForm.activo,
        tipo_practica_nombre: tipoReglaSeleccionado?.nombre ?? reglaPracticaForm.tipo_practica_nombre,
      },
      reglasPractica,
      tiposPractica,
    ),
    reglaExistenteMismaClave && reglaExistenteMismaClave.activo
      ? "Ya existe una regla para esta carrera y tipo de practica. Edita la regla existente."
      : null,
  ].filter((mensaje): mensaje is string => Boolean(mensaje));
  const advertenciasReglaPractica = [
    reglaExistenteMismaClave && !reglaExistenteMismaClave.activo
      ? "Ya existe una regla inactiva para esta carrera y tipo. Puedes reactivarla o editarla."
      : null,
    periodosRestantesRegla === 0 ? "Esta practica queda al final de la carrera." : null,
    periodosRestantesRegla === 1 ? `Solo queda 1 ${unidadPeriodoRegla} despues de esta practica.` : null,
    periodosRestantesRegla !== null && periodosRestantesRegla > 1
      ? `Despues de esta practica restan ${periodosRestantesRegla} ${unidadPeriodoRegla === "cuatrimestre" ? "cuatrimestres" : "semestres"}.`
      : null,
  ].filter((mensaje): mensaje is string => Boolean(mensaje));
  const reglaPracticaBloqueada =
    cargando ||
    erroresReglaPractica.length > 0 ||
    Boolean(reglaExistenteMismaClave && !reglaExistenteMismaClave.activo && !modoEdicion);
  const resumenReglasPorCarrera = carreras
    .filter((carrera) => carrera.estado === "Activa")
    .map((carrera) => {
      const reglasActivasCarrera = reglasPractica.filter((regla) => regla.id_carrera === carrera.id_carrera && regla.activo);
      const tiposConfigurados = new Set(reglasActivasCarrera.map((regla) => regla.id_tipo_practica));
      const tiposFaltantes = tiposPracticaActivos.filter((tipo) => !tiposConfigurados.has(tipo.id_tipo_practica));
      return {
        carrera,
        configuradas: tiposPracticaActivos.length - tiposFaltantes.length,
        total: tiposPracticaActivos.length,
        faltantes: tiposFaltantes,
      };
    });
  const carrerasSinReglas = resumenReglasPorCarrera.filter((item) => item.faltantes.length > 0);
  const reglasConHorasCero = reglasPractica.filter((regla) => regla.horas_requeridas <= 0);
  const carrerasSinDuracion = carreras.filter((carrera) => carrera.estado === "Activa" && carrera.duracion_periodos === null);
  const carrerasSinCreditos = carreras.filter((carrera) => carrera.estado === "Activa" && carrera.creditos_totales === null);
  const reglasMigradas = reglasPractica.filter((regla) =>
    (regla.observaciones ?? "").toLowerCase().includes("migrada desde tipo_practica"),
  );
  const reglasDeCarreraSeleccionada = carreraReglaSeleccionada
    ? reglasPractica.filter((regla) => regla.id_carrera === carreraReglaSeleccionada.id_carrera)
    : [];
  const reglasVisibles = reglaPracticaForm.id_tipo_practica
    ? reglasDeCarreraSeleccionada.filter((regla) => regla.id_tipo_practica === reglaPracticaForm.id_tipo_practica)
    : reglasDeCarreraSeleccionada;
  const noExisteReglaSeleccionada =
    Boolean(carreraReglaSeleccionada && reglaPracticaForm.id_tipo_practica) && reglasVisibles.length === 0;

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
        descripcion: "Catalogo general y valores globales de respaldo.",
        registros: tiposPractica.length,
        icono: CheckCircle2,
        tipo: "tipos-practica" as CatalogoActivo,
      },
      {
        titulo: "Reglas por carrera",
        descripcion: "Requisitos por carrera y tipo de practica.",
        registros: reglasPractica.length,
        icono: Database,
        tipo: "reglas-practica" as CatalogoActivo,
      },
    ],
    [carreras.length, convocatorias.length, tiposPractica.length, reglasPractica.length],
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
              El periodo no se captura por alumno: se toma automaticamente del tipo de periodo configurado en la carrera. Para carreras cuatrimestrales, semestre representa el cuatrimestre actual del alumno.
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
            className={`bg-white rounded-2xl shadow-2xl ${catalogoActivo === "convocatorias" ? "max-w-6xl" : "max-w-4xl"} w-full max-h-[90vh] overflow-y-auto p-8`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="font-bold text-xl text-[#0d2b5e]">
                  {catalogoActivo === "carreras" && "Administrar carreras"}
                  {catalogoActivo === "convocatorias" && "Administrar convocatorias"}
                  {catalogoActivo === "tipos-practica" && "Administrar tipos de practica"}
                  {catalogoActivo === "reglas-practica" && "Reglas de practica por carrera"}
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
                <div className="grid md:grid-cols-[1.5fr_1fr_1fr_1fr_1fr_auto] gap-3">
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
                  <input
                    type="number"
                    min={1}
                    placeholder={etiquetaPeriodoCarreraForm}
                    value={carreraForm.duracion_periodos ?? ""}
                    onChange={(event) => setCarreraForm({ ...carreraForm, duracion_periodos: Number(event.target.value) || null })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />
                  <input
                    type="number"
                    min={0}
                    placeholder="Creditos totales"
                    value={carreraForm.creditos_totales ?? ""}
                    onChange={(event) => setCarreraForm({ ...carreraForm, creditos_totales: Number(event.target.value) || null })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                  />
                  <select
                    value={carreraForm.estado}
                    onChange={(event) => setCarreraForm({ ...carreraForm, estado: event.target.value as Carrera["estado"] })}
                    className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white"
                  >
                    <option value="Activa">Activa</option>
                    <option value="Inactiva">Inactiva</option>
                  </select>
                  <button onClick={guardarCarrera} disabled={cargando} className="bg-[#0d2b5e] text-white rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-50">
                    {modoEdicion ? "Guardar cambios" : "Crear carrera"}
                  </button>
                </div>

                <div className="space-y-3">
                  {carreras.map((carrera) => (
                    <div key={carrera.id_carrera} className="border rounded-xl px-4 py-3 flex items-center justify-between gap-4">
                      <div>
                        <div className="font-semibold text-[#0d2b5e]">{carrera.nombre}</div>
                        <div className="text-xs text-[#1565c0] mt-1">{carrera.tipo_periodo}</div>
                        <div className="text-xs text-gray-500 mt-1">
                          Duracion: {carrera.duracion_periodos ?? "No configurado"} {carrera.duracion_periodos ? (carrera.tipo_periodo === "Cuatrimestral" ? "cuatrimestres" : "semestres") : ""}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          Creditos totales: {carrera.creditos_totales ?? "No configurado"}
                        </div>
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
                <section className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-[#0d2b5e]">
                        {modoEdicion ? "Convocatoria en edicion" : "Nueva convocatoria"}
                      </h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Configura datos generales y fechas del proceso.
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

                  <div className="p-5 space-y-5">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-[#0d2b5e]">
                      <span className="font-semibold">Calendario operativo: </span>
                      El periodo general representa la operacion de la convocatoria, no necesariamente el inicio del semestre o cuatrimestre. Puede iniciar antes si requiere registro, documentos o validacion previa.
                    </div>

                    <div>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <h5 className="text-sm font-bold text-[#0d2b5e]">Datos generales</h5>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#1565c0] border border-blue-100">
                          {convocatoriaForm.tipo_periodo}
                        </span>
                      </div>
                      <div className="grid lg:grid-cols-[1.4fr_0.8fr_0.8fr] gap-3">
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
                    </div>

                    <div className="border border-gray-200 rounded-2xl overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/80">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
                      <div>
                        <h5 className="font-bold text-sm text-[#0d2b5e] flex items-center gap-2">
                          <CalendarDays className="w-4 h-4" />
                          {modoAvanzadoConvocatoria ? "Configuración avanzada" : "Calendario simplificado"}
                        </h5>
                        <p className="text-xs text-gray-500 mt-1">
                          {modoAvanzadoConvocatoria
                            ? "Ajusta las 8 fases internas del proceso."
                            : "El modo básico agrupa las etapas para facilitar la administración. El modo avanzado permite ajustar fechas internas del proceso."}
                        </p>
                        <p className="text-xs text-[#1565c0] mt-1">
                          Conflictos solo contra convocatorias {tipoPeriodoPlural} activas.
                        </p>
                      </div>
                      <div className="flex flex-col items-start lg:items-end gap-2">
                        <button
                          type="button"
                          onClick={() => setModoAvanzadoConvocatoria((actual) => !actual)}
                          className="text-xs font-semibold px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-[#1565c0] hover:bg-blue-100"
                        >
                          {modoAvanzadoConvocatoria ? "Volver al modo básico" : "Ver configuración avanzada"}
                        </button>
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center gap-1 text-xs text-green-700">
                            <span className="w-2 h-2 rounded-full bg-green-500" />
                            Valida
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-red-700">
                            <span className="w-2 h-2 rounded-full bg-red-500" />
                            Conflicto
                          </span>
                          <span className="inline-flex items-center gap-1 text-xs text-yellow-700">
                            <span className="w-2 h-2 rounded-full bg-yellow-400" />
                            Pendiente
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${resumenCalendario.completo ? "bg-green-50 text-green-700 border-green-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
                            {resumenCalendario.completo ? "Calendario completo" : "Calendario incompleto"}
                          </span>
                          <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${resumenCalendario.flujoValido && !calendarioTieneConflictos ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                            {resumenCalendario.flujoValido && !calendarioTieneConflictos ? "Flujo valido" : "Flujo invalido"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className={`mt-3 text-xs rounded-lg px-3 py-2 border ${resumenCalendario.flujoValido && !calendarioTieneConflictos ? "bg-green-50 text-green-700 border-green-200" : "bg-red-50 text-red-700 border-red-200"}`}>
                      <span className="font-semibold">Validacion del calendario: </span>
                      {resumenCalendario.flujoValido && !calendarioTieneConflictos
                        ? "Calendario valido. Las etapas respetan el flujo."
                        : "Hay fechas en conflicto. Revisa los campos marcados en rojo."}
                    </div>
                    {resumenCalendario.error && (
                      <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        {resumenCalendario.error}
                      </div>
                    )}
                    {conflictosMismoTipo.length > 0 && (
                      <div className="mt-3 text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                        Ya existe una convocatoria {convocatoriaForm.tipo_periodo} activa que se cruza con este periodo:{" "}
                        {conflictosMismoTipo.map((convocatoria) => convocatoria.nombre).join(", ")}.
                      </div>
                    )}
                  </div>

                      {!modoAvanzadoConvocatoria && (
                        <div className="p-4 space-y-4">
                          <div className="border border-blue-100 bg-blue-50/40 rounded-xl p-4">
                            <div className="font-bold text-sm text-[#0d2b5e]">Periodo general</div>
                            <p className="text-xs text-gray-600 mt-1">
                              El periodo general representa el calendario operativo de la convocatoria. Puede iniciar antes del semestre o cuatrimestre para permitir registro, documentación y validación previa.
                            </p>
                            <div className="grid sm:grid-cols-2 gap-3 mt-3">
                              <label className="block">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase">Fecha inicio</span>
                                <input
                                  type="date"
                                  required
                                  value={convocatoriaForm.fecha_inicio_general ?? ""}
                                  onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, fecha_inicio_general: event.target.value || null })}
                                  className="mt-1 w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm"
                                />
                              </label>
                              <label className="block">
                                <span className="text-[11px] font-semibold text-gray-500 uppercase">Fecha cierre</span>
                                <input
                                  type="date"
                                  required
                                  min={convocatoriaForm.fecha_inicio_general ?? undefined}
                                  value={convocatoriaForm.fecha_cierre_general ?? ""}
                                  onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, fecha_cierre_general: event.target.value || null })}
                                  className="mt-1 w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm"
                                />
                              </label>
                            </div>
                          </div>

                          <div className="grid lg:grid-cols-2 gap-3">
                            {bloquesConvocatoria.map((bloque) => {
                              const inicio = convocatoriaForm[bloque.inicioCampo] as string | null;
                              const cierre = convocatoriaForm[bloque.cierreCampo] as string | null;
                              return (
                                <div key={bloque.nombre} className="border border-gray-200 rounded-xl p-4">
                                  <div className="flex items-start gap-3">
                                    <span className="w-8 h-8 shrink-0 rounded-full bg-blue-50 text-[#1565c0] text-sm font-bold flex items-center justify-center">
                                      {bloque.orden}
                                    </span>
                                    <div>
                                      <div className="font-bold text-sm text-[#0d2b5e]">{bloque.nombre}</div>
                                      <p className="text-xs text-gray-600 mt-1">{bloque.descripcion}</p>
                                      {bloque.nota && <p className="text-xs text-[#1565c0] mt-2">{bloque.nota}</p>}
                                    </div>
                                  </div>
                                  <div className="grid sm:grid-cols-2 gap-2 mt-4">
                                    <label className="block">
                                      <span className="text-[11px] font-semibold text-gray-500 uppercase">Fecha inicio</span>
                                      <input
                                        type="date"
                                        required
                                        value={inicio ?? ""}
                                        onChange={(event) => setConvocatoriaForm(distribuirFechasBloque(
                                          convocatoriaForm,
                                          bloque,
                                          event.target.value || null,
                                          cierre
                                        ))}
                                        className="mt-1 w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm"
                                      />
                                    </label>
                                    <label className="block">
                                      <span className="text-[11px] font-semibold text-gray-500 uppercase">Fecha cierre</span>
                                      <input
                                        type="date"
                                        required
                                        min={inicio ?? undefined}
                                        value={cierre ?? ""}
                                        onChange={(event) => setConvocatoriaForm(distribuirFechasBloque(
                                          convocatoriaForm,
                                          bloque,
                                          inicio,
                                          event.target.value || null
                                        ))}
                                        className="mt-1 w-full px-3 py-2 border-2 border-gray-200 rounded-lg text-sm"
                                      />
                                    </label>
                                  </div>
                                  {bloque.etapas.length > 1 && inicio && cierre && (
                                    <p className="text-[11px] text-green-700 mt-2">
                                      Las fechas internas se distribuyen automáticamente y conservan el orden.
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {modoAvanzadoConvocatoria && (
                      <div className="p-4 grid lg:grid-cols-2 gap-3">
                    {etapasConvocatoria.map((etapa) => {
                      const validacionInicio = validarCampoFecha(
                        etapa.inicioCampo,
                        convocatoriaForm[etapa.inicioCampo] as string | null,
                        convocatoriaForm,
                        convocatorias
                      );
                      const validacionCierre = validarCampoFecha(
                        etapa.cierreCampo,
                        convocatoriaForm[etapa.cierreCampo] as string | null,
                        convocatoriaForm,
                        convocatorias
                      );
                      const estadoEtapa = obtenerEstadoEtapa(convocatoriaForm, etapa, convocatorias);
                      const IconoEstado = estadoEtapa.icono;
                      return (
                        <div key={etapa.nombre} className="border border-gray-200 rounded-xl p-3">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="w-7 h-7 shrink-0 rounded-full bg-blue-50 text-[#1565c0] text-xs font-bold flex items-center justify-center">
                                  {etapa.orden}
                                </span>
                                <div className="font-bold text-sm text-[#0d2b5e]">{etapa.nombre}</div>
                              </div>
                              <p className="text-xs text-gray-500 mt-1 truncate">{etapa.descripcion}</p>
                            </div>
                            <span className={`shrink-0 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-1 rounded-full border ${estadoEtapa.clase}`}>
                              <IconoEstado className="w-3 h-3" />
                              {estadoEtapa.texto}
                            </span>
                          </div>
                          <div className="grid sm:grid-cols-2 gap-2 mt-3">
                            <label className="block">
                              <span className="text-[11px] font-semibold text-gray-500 uppercase">Fecha inicio</span>
                              <input
                                type="date"
                                required
                                min={validacionInicio.min}
                                max={validacionInicio.max}
                                aria-label={`Inicio ${etapa.nombre}`}
                                value={(convocatoriaForm[etapa.inicioCampo] as string | null) ?? ""}
                                onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, [etapa.inicioCampo]: event.target.value || null })}
                                className={`mt-1 w-full px-3 py-2 border-2 rounded-lg text-sm ${obtenerClaseInputFecha(validacionInicio)}`}
                              />
                              <span className={`mt-1 block text-[11px] leading-snug ${obtenerClaseMensajeFecha(validacionInicio)}`}>
                                {validacionInicio.mensaje}
                              </span>
                            </label>
                            <label className="block">
                              <span className="text-[11px] font-semibold text-gray-500 uppercase">Fecha cierre</span>
                              <input
                                type="date"
                                required
                                min={validacionCierre.min}
                                max={validacionCierre.max}
                                aria-label={`Cierre ${etapa.nombre}`}
                                value={(convocatoriaForm[etapa.cierreCampo] as string | null) ?? ""}
                                onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, [etapa.cierreCampo]: event.target.value || null })}
                                className={`mt-1 w-full px-3 py-2 border-2 rounded-lg text-sm ${obtenerClaseInputFecha(validacionCierre)}`}
                              />
                              <span className={`mt-1 block text-[11px] leading-snug ${obtenerClaseMensajeFecha(validacionCierre)}`}>
                                {validacionCierre.mensaje}
                              </span>
                            </label>
                          </div>
                        </div>
                      );
                    })}
                      </div>
                      )}
                    </div>

                    <details className="border border-gray-200 rounded-xl bg-gray-50/50">
                      <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#0d2b5e]">
                        Observaciones
                      </summary>
                      <div className="px-4 pb-4">
                        <textarea
                          value={convocatoriaForm.observaciones ?? ""}
                          onChange={(event) => setConvocatoriaForm({ ...convocatoriaForm, observaciones: event.target.value })}
                          className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white"
                          placeholder="Notas internas de la convocatoria"
                          rows={3}
                        />
                      </div>
                    </details>
                  </div>

                  <div className="sticky bottom-0 z-10 bg-white/95 backdrop-blur border-t border-gray-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setModoEdicion(false);
                        limpiarFormularios();
                      }}
                      className="border border-gray-200 text-gray-700 rounded-xl px-4 py-2.5 text-sm font-semibold hover:bg-gray-50"
                    >
                      Cancelar / limpiar
                    </button>
                    <button
                      onClick={guardarConvocatoria}
                      disabled={guardarConvocatoriaBloqueado}
                      title={guardarConvocatoriaBloqueado ? "Completa el calendario y corrige los campos marcados." : undefined}
                      className="bg-[#0d2b5e] text-white rounded-xl px-5 py-2.5 text-sm font-bold disabled:opacity-50"
                    >
                      {modoEdicion ? "Guardar cambios" : "Crear convocatoria"}
                    </button>
                  </div>
                </section>

                <section className="border border-gray-200 rounded-2xl bg-white shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-100 bg-gray-50/80 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-[#0d2b5e]">Convocatorias registradas</h4>
                      <p className="text-xs text-gray-500 mt-1">
                        Cada convocatoria mantiene su calendario, estado y fase actual.
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-blue-50 text-[#1565c0] border border-blue-100">
                      {convocatorias.length}
                    </span>
                  </div>

                  <div className="p-5 grid xl:grid-cols-2 gap-3">
                  {convocatorias.map((convocatoria) => (
                    <div key={convocatoria.id_convocatoria} className="border border-gray-200 rounded-xl p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="font-semibold text-[#0d2b5e] truncate">{convocatoria.nombre}</div>
                          <div className="text-xs text-gray-500 mt-1">
                            {fechaTexto(convocatoria.fecha_inicio_general)} - {fechaTexto(convocatoria.fecha_cierre_general)}
                          </div>
                        </div>
                        <span className={`shrink-0 text-xs px-2.5 py-1 rounded-full font-semibold border ${convocatoria.estado === "Activa" ? "bg-green-50 text-green-700 border-green-200" : convocatoria.estado === "Cerrada" ? "bg-gray-100 text-gray-700 border-gray-200" : "bg-yellow-50 text-yellow-700 border-yellow-200"}`}>
                          {convocatoria.estado}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-3">
                        <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-[#1565c0] font-semibold">
                          {convocatoria.tipo_periodo}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                          {convocatoria.fase_actual}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-4">
                        <button
                          onClick={() => {
                            setModoEdicion(true);
                            setModoAvanzadoConvocatoria(false);
                            setConvocatoriaForm(convocatoria);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                          title="Editar"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => repetirCicloConvocatoria(convocatoria)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg"
                          title="Repetir ciclo"
                        >
                          <RefreshCw className="w-4 h-4" />
                          Repetir ciclo
                        </button>
                        <button
                          onClick={() => cambiarEstadoConvocatoria(convocatoria, "Inactiva")}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg"
                          title="Desactivar"
                        >
                          <Power className="w-4 h-4" />
                          Desactivar
                        </button>
                        <button
                          onClick={() => cambiarEstadoConvocatoria(convocatoria, "Cerrada")}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg"
                          title="Cerrar"
                        >
                          <Archive className="w-4 h-4" />
                          Cerrar
                        </button>
                        <button
                          onClick={() => eliminarConvocatoriaAdmin(convocatoria)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                          Eliminar
                        </button>
                      </div>
                    </div>
                  ))}
                  {convocatorias.length === 0 && (
                    <div className="xl:col-span-2 border border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
                      No hay convocatorias registradas.
                    </div>
                  )}
                  </div>
                </section>
              </div>
            )}

            {catalogoActivo === "reglas-practica" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-[#0d2b5e]">
                  <div className="font-semibold">Configuracion oficial por carrera</div>
                  <p className="mt-1">
                    Configura aqui los requisitos oficiales de practicas para cada carrera. Estos valores determinan la elegibilidad del alumno segun su carrera, periodo actual y creditos aprobados.
                  </p>
                  <p className="mt-1 text-xs">
                    Los valores globales de Tipos de practica solo se usan como respaldo cuando una carrera no tiene regla especifica activa. Modificar una regla puede cambiar que alumnos aparecen como elegibles en el padron.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
                  <h4 className="font-bold text-[#0d2b5e] text-sm">Estado de configuracion</h4>
                  {carrerasSinReglas.length === 0 ? (
                    <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">
                      Todas las carreras activas tienen reglas configuradas para los tipos de practica activos.
                    </div>
                  ) : (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                      <div className="font-semibold">Hay carreras con reglas incompletas.</div>
                      <p className="mt-1">Si falta una regla, el sistema usara los valores globales de respaldo.</p>
                      <div className="mt-2 space-y-1 text-xs">
                        {carrerasSinReglas.map(({ carrera, faltantes }) => (
                          <div key={carrera.id_carrera}>
                            <span className="font-semibold">{carrera.nombre}:</span> faltan {faltantes.map((tipo) => tipo.nombre).join(", ")}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {reglasConHorasCero.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-700">
                      Hay reglas con horas requeridas en 0. Revisa la configuracion antes de usar el proceso.
                    </div>
                  )}
                  {carrerasSinDuracion.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 text-sm text-yellow-800">
                      Hay carreras sin duracion configurada. No se podra validar si el periodo requerido excede la duracion.
                    </div>
                  )}
                  {carrerasSinCreditos.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-[#0d2b5e]">
                      Hay carreras sin creditos totales configurados. No se podra validar si los creditos minimos exceden el total de la carrera.
                    </div>
                  )}
                  {reglasMigradas.length > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-sm text-[#0d2b5e]">
                      Algunas reglas fueron migradas desde valores globales. Revisalas y ajustalas segun el plan de estudios de cada carrera.
                    </div>
                  )}

                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {resumenReglasPorCarrera.map(({ carrera, configuradas, total, faltantes }) => {
                      const estado = total === 0 ? "Sin tipos activos" : faltantes.length === 0 ? "Completa" : configuradas === 0 ? "Sin reglas" : "Incompleta";
                      return (
                        <button
                          key={carrera.id_carrera}
                          type="button"
                          onClick={() =>
                            setReglaPracticaForm({
                              ...reglaPracticaForm,
                              id_carrera: carrera.id_carrera,
                              carrera_tipo_periodo: carrera.tipo_periodo,
                              carrera_duracion_periodos: carrera.duracion_periodos,
                              carrera_creditos_totales: carrera.creditos_totales,
                            })
                          }
                          className="text-left border border-gray-200 rounded-xl p-3 hover:border-[#1565c0] hover:bg-blue-50/40 transition"
                        >
                          <div className="font-semibold text-sm text-[#0d2b5e]">{carrera.nombre}</div>
                          <div className="text-xs text-gray-500 mt-1">{configuradas}/{total} reglas configuradas</div>
                          <span className={`inline-flex mt-2 text-xs px-2 py-1 rounded-full font-semibold ${faltantes.length === 0 ? "bg-green-50 text-green-700" : configuradas === 0 ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>
                            {estado}
                          </span>
                          {faltantes.length > 0 && (
                            <div className="text-xs text-gray-500 mt-2">
                              Faltan: {faltantes.map((tipo) => tipo.nombre).join(", ")}
                            </div>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-3">
                  {[
                    {
                      titulo: "Carrera",
                      texto: "Define si el requisito se mide en semestres o cuatrimestres y su duracion maxima.",
                    },
                    {
                      titulo: "Tipo de practica",
                      texto: "El catalogo se mantiene simple; aqui se capturan los requisitos reales por carrera.",
                    },
                    {
                      titulo: "Secuencia",
                      texto: "Practicas 1 debe quedar antes de Practicas 2, y Residencia despues de ambas.",
                    },
                  ].map((ayuda) => (
                    <div key={ayuda.titulo} className="border border-gray-200 rounded-xl p-3 bg-gray-50">
                      <div className="text-xs font-bold text-[#0d2b5e] uppercase tracking-wide">{ayuda.titulo}</div>
                      <p className="text-xs text-gray-600 mt-1">{ayuda.texto}</p>
                    </div>
                  ))}
                </div>

                <div className="border border-gray-200 rounded-2xl p-4 space-y-4">
                  <div className="grid md:grid-cols-2 gap-3">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-gray-700">Carrera</span>
                      <select
                        value={reglaPracticaForm.id_carrera || ""}
                        onChange={(event) => {
                          const idCarrera = Number(event.target.value) || 0;
                          const carrera = carreras.find((item) => item.id_carrera === idCarrera);
                          setReglaPracticaForm({
                            ...reglaPracticaForm,
                            id_carrera: idCarrera,
                            carrera_tipo_periodo: carrera?.tipo_periodo ?? null,
                            carrera_duracion_periodos: carrera?.duracion_periodos ?? null,
                            carrera_creditos_totales: carrera?.creditos_totales ?? null,
                          });
                        }}
                        disabled={modoEdicion}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white disabled:bg-gray-100"
                      >
                        <option value="">Selecciona carrera</option>
                        {carreras.map((carrera) => (
                          <option key={carrera.id_carrera} value={carrera.id_carrera}>
                            {carrera.nombre}
                          </option>
                        ))}
                      </select>
                      <span className="block text-xs text-gray-500">Selecciona la carrera a la que aplicara esta regla.</span>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-gray-700">Tipo de practica</span>
                      <select
                        value={reglaPracticaForm.id_tipo_practica || ""}
                        onChange={(event) => setReglaPracticaForm({ ...reglaPracticaForm, id_tipo_practica: Number(event.target.value) || 0 })}
                        disabled={modoEdicion}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white disabled:bg-gray-100"
                      >
                        <option value="">Selecciona tipo de practica</option>
                        {tiposPractica.map((tipo) => (
                          <option key={tipo.id_tipo_practica} value={tipo.id_tipo_practica}>
                            {tipo.nombre}
                          </option>
                        ))}
                      </select>
                      <span className="block text-xs text-gray-500">Selecciona Practicas 1, Practicas 2 o Residencia.</span>
                    </label>
                  </div>

                  {!carreraReglaSeleccionada && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-600">
                      Selecciona una carrera para configurar sus requisitos especificos.
                    </div>
                  )}

                  {carreraReglaSeleccionada && (
                    <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                      <div className="text-sm font-semibold text-[#0d2b5e]">Carrera seleccionada</div>
                      <div className="flex flex-wrap gap-2 text-xs mt-2">
                        <span className="px-2.5 py-1 rounded-full bg-blue-50 text-[#1565c0] font-semibold">
                          Tipo de periodo: {carreraReglaSeleccionada.tipo_periodo}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                          Duracion: {carreraReglaSeleccionada.duracion_periodos ? `${carreraReglaSeleccionada.duracion_periodos} ${carreraReglaSeleccionada.tipo_periodo === "Cuatrimestral" ? "cuatrimestres" : "semestres"}` : "No configurada"}
                        </span>
                        <span className="px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                          Creditos totales: {carreraReglaSeleccionada.creditos_totales ?? "No configurados"}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-2">
                        Esta regla solo aplicara a esta carrera. No afecta a las demas carreras.
                      </p>
                    </div>
                  )}

                  {reglaPracticaForm.id_tipo_practica > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 text-sm text-[#0d2b5e]">
                      Esta regla reemplaza los valores globales de respaldo para esta carrera y tipo de practica.
                    </div>
                  )}

                  {carreraReglaSeleccionada && periodosRestantesRegla !== null && periodosRestantesRegla >= 0 && (
                    <div className={`border rounded-xl px-4 py-3 text-sm ${periodosRestantesRegla <= 1 ? "bg-yellow-50 border-yellow-200 text-yellow-800" : "bg-green-50 border-green-200 text-green-700"}`}>
                      Periodos restantes despues de esta practica: <span className="font-bold">{periodosRestantesRegla}</span>.
                    </div>
                  )}

                  <div className="grid md:grid-cols-5 gap-3">
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-gray-700">{etiquetaPeriodoRegla}</span>
                      <input
                        type="number"
                        min={1}
                        max={limitePeriodoRegla ?? undefined}
                        value={reglaPracticaForm.periodo_requerido}
                        onChange={(event) => setReglaPracticaForm({ ...reglaPracticaForm, periodo_requerido: Number(event.target.value) })}
                        className={`w-full px-4 py-3 border-2 rounded-xl text-sm ${reglaPracticaForm.periodo_requerido < 1 || (limitePeriodoRegla !== null && reglaPracticaForm.periodo_requerido > limitePeriodoRegla) ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                        placeholder={etiquetaPeriodoRegla}
                      />
                      {carreraReglaSeleccionada && (
                        <span className="block text-xs text-gray-500">
                          Periodo minimo en el que el alumno puede iniciar este proceso. Maximo: {limitePeriodoRegla ?? "sin definir"}.
                        </span>
                      )}
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-gray-700">Creditos minimos</span>
                      <input
                        type="number"
                        min={0}
                        max={limiteCreditosRegla ?? undefined}
                        value={reglaPracticaForm.creditos_minimos}
                        onChange={(event) => setReglaPracticaForm({ ...reglaPracticaForm, creditos_minimos: Number(event.target.value) || 0 })}
                        className={`w-full px-4 py-3 border-2 rounded-xl text-sm ${reglaPracticaForm.creditos_minimos < 0 || (limiteCreditosRegla !== null && reglaPracticaForm.creditos_minimos > limiteCreditosRegla) ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                        placeholder="Creditos minimos"
                      />
                      <span className="block text-xs text-gray-500">Creditos aprobados requeridos para iniciar este proceso.</span>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-gray-700">Horas requeridas</span>
                      <input
                        type="number"
                        min={1}
                        value={reglaPracticaForm.horas_requeridas}
                        onChange={(event) => setReglaPracticaForm({ ...reglaPracticaForm, horas_requeridas: Number(event.target.value) })}
                        className={`w-full px-4 py-3 border-2 rounded-xl text-sm ${reglaPracticaForm.horas_requeridas <= 0 ? "border-red-300 bg-red-50" : "border-gray-200"}`}
                        placeholder="Horas requeridas"
                      />
                      <span className="block text-xs text-gray-500">Horas que el alumno debera cumplir en este proceso.</span>
                    </label>
                    <label className="space-y-1">
                      <span className="text-xs font-semibold text-gray-700">Estado</span>
                      <select
                        value={reglaPracticaForm.activo ? "1" : "0"}
                        onChange={(event) => setReglaPracticaForm({ ...reglaPracticaForm, activo: event.target.value === "1" })}
                        className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white"
                      >
                        <option value="1">Activa</option>
                        <option value="0">Inactiva</option>
                      </select>
                      <span className="block text-xs text-gray-500">Activa o desactiva esta regla sin eliminarla.</span>
                    </label>
                    <button
                      onClick={guardarReglaPractica}
                      disabled={reglaPracticaBloqueada}
                      className="bg-[#0d2b5e] text-white rounded-xl px-5 py-3 text-sm font-bold disabled:opacity-50 self-start md:mt-5"
                    >
                      {modoEdicion ? "Guardar regla" : "Crear regla"}
                    </button>
                  </div>

                  <label className="block space-y-1">
                    <span className="text-xs font-semibold text-gray-700">Observaciones</span>
                    <textarea
                      value={reglaPracticaForm.observaciones ?? ""}
                      onChange={(event) => setReglaPracticaForm({ ...reglaPracticaForm, observaciones: event.target.value })}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm"
                      rows={2}
                      placeholder="Notas internas sobre esta regla"
                    />
                    <span className="block text-xs text-gray-500">Notas internas sobre esta regla.</span>
                  </label>

                  {limitePeriodoRegla !== null && reglaPracticaForm.periodo_requerido > limitePeriodoRegla && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      El periodo requerido no puede ser mayor a la duracion de la carrera.
                    </div>
                  )}
                  {limiteCreditosRegla !== null && reglaPracticaForm.creditos_minimos > limiteCreditosRegla && (
                    <div className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      Los creditos minimos no pueden superar los creditos totales de la carrera.
                    </div>
                  )}
                  {erroresReglaPractica.length > 0 && (
                    <div className="space-y-1">
                      {erroresReglaPractica.map((mensaje) => (
                        <div key={mensaje} className="text-xs text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                          {mensaje}
                        </div>
                      ))}
                    </div>
                  )}
                  {advertenciasReglaPractica.length > 0 && (
                    <div className="space-y-1">
                      {advertenciasReglaPractica.map((mensaje) => (
                        <div key={mensaje} className="text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
                          {mensaje}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {carreraReglaSeleccionada && (
                    <div className="border border-gray-200 rounded-2xl p-4 space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-[#0d2b5e] text-sm">Reglas de: {carreraReglaSeleccionada.nombre}</h4>
                          <p className="text-xs text-gray-500 mt-1">
                            {reglaPracticaForm.id_tipo_practica
                              ? `Filtro activo: ${tipoReglaSeleccionado?.nombre ?? "Tipo de practica"}`
                              : "Mostrando solo las reglas de esta carrera."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setModoEdicion(false);
                            setReglaPracticaForm(reglaPracticaInicial);
                          }}
                          className="text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg px-3 py-2"
                        >
                          Cambiar carrera
                        </button>
                      </div>
                      {noExisteReglaSeleccionada && (
                        <div className="text-sm text-[#0d2b5e] bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                          No existe una regla para esta carrera y tipo de practica. Puedes crearla.
                        </div>
                      )}
                    </div>
                  )}

                  {carreraReglaSeleccionada && reglasVisibles.map((regla) => {
                    const carreraRegla = carreras.find((carrera) => carrera.id_carrera === regla.id_carrera);
                    const tipoPeriodo = regla.carrera_tipo_periodo ?? carreraRegla?.tipo_periodo ?? "Semestral";
                    const duracion = regla.carrera_duracion_periodos ?? carreraRegla?.duracion_periodos ?? null;
                    const creditosTotales = regla.carrera_creditos_totales ?? carreraRegla?.creditos_totales ?? null;
                    const periodosRestantes = duracion !== null ? duracion - regla.periodo_requerido : null;
                    const periodoFueraDuracion = duracion !== null && regla.periodo_requerido > duracion;
                    const creditosExcedenTotal = creditosTotales !== null && regla.creditos_minimos > creditosTotales;
                    const erroresSecuencia = obtenerErroresSecuenciaRegla(regla, reglasPractica, tiposPractica);
                    const reglaMigrada = (regla.observaciones ?? "").toLowerCase().includes("migrada desde tipo_practica");
                    return (
                    <div key={regla.id_regla_practica_carrera} className="border border-gray-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                      <div>
                        <div className="font-semibold text-[#0d2b5e]">
                          {regla.carrera_nombre ?? "Carrera"} + {regla.tipo_practica_nombre ?? "Tipo de practica"}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-2 text-xs">
                          <span className="px-2 py-1 rounded-full bg-blue-50 text-[#1565c0] font-semibold">
                            {tipoPeriodo}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-blue-50 text-[#1565c0] font-semibold">
                            {tipoPeriodo === "Cuatrimestral" ? "Cuatrimestre" : "Semestre"} {regla.periodo_requerido}
                          </span>
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                            {regla.creditos_minimos} creditos
                          </span>
                          <span className="px-2 py-1 rounded-full bg-gray-100 text-gray-700 font-semibold">
                            {regla.horas_requeridas} horas
                          </span>
                          <span className={`px-2 py-1 rounded-full font-semibold ${regla.activo ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                            {regla.activo ? "Activa" : "Inactiva"}
                          </span>
                          {periodosRestantes !== null && periodosRestantes >= 0 && (
                            <span className={`px-2 py-1 rounded-full font-semibold ${periodosRestantes <= 1 ? "bg-yellow-50 text-yellow-800" : "bg-green-50 text-green-700"}`}>
                              Restan {periodosRestantes}
                            </span>
                          )}
                          {reglaMigrada && (
                            <span
                              className="px-2 py-1 rounded-full bg-blue-50 text-[#1565c0] font-semibold"
                              title="Esta regla fue creada automaticamente desde los valores globales. Revisala contra el plan de estudios."
                            >
                              Migrada
                            </span>
                          )}
                          {regla.horas_requeridas <= 0 && (
                            <span className="px-2 py-1 rounded-full bg-red-50 text-red-700 font-semibold">Horas no configuradas</span>
                          )}
                          {periodoFueraDuracion && (
                            <span className="px-2 py-1 rounded-full bg-red-50 text-red-700 font-semibold">Periodo fuera de duracion</span>
                          )}
                          {creditosExcedenTotal && (
                            <span className="px-2 py-1 rounded-full bg-red-50 text-red-700 font-semibold">Creditos exceden el total</span>
                          )}
                          {erroresSecuencia.length > 0 && (
                            <span className="px-2 py-1 rounded-full bg-red-50 text-red-700 font-semibold">Secuencia invalida</span>
                          )}
                        </div>
                        {erroresSecuencia.length > 0 && (
                          <div className="space-y-1 mt-2">
                            {erroresSecuencia.map((mensaje) => (
                              <div key={mensaje} className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                {mensaje}
                              </div>
                            ))}
                          </div>
                        )}
                        {regla.observaciones && !reglaMigrada && <div className="text-xs text-gray-500 mt-2">{regla.observaciones}</div>}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => {
                            setModoEdicion(true);
                            setReglaPracticaForm(regla);
                          }}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg"
                        >
                          <Edit2 className="w-4 h-4" />
                          Editar
                        </button>
                        <button
                          onClick={() => cambiarEstadoReglaPractica(regla, !regla.activo)}
                          className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold text-gray-700 bg-gray-50 hover:bg-gray-100 rounded-lg"
                        >
                          <Power className="w-4 h-4" />
                          {regla.activo ? "Desactivar" : "Activar"}
                        </button>
                      </div>
                    </div>
                    );
                  })}
                  {carreraReglaSeleccionada && reglasVisibles.length === 0 && !noExisteReglaSeleccionada && (
                    <div className="border border-dashed border-gray-200 rounded-xl p-6 text-center text-sm text-gray-500">
                      No hay reglas registradas para esta carrera.
                    </div>
                  )}
                </div>
              </div>
            )}

            {catalogoActivo === "tipos-practica" && (
              <div className="space-y-6">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-[#0d2b5e]">
                  Los tipos de practica son el catalogo general del proceso. Los requisitos oficiales se capturan en Reglas por carrera.
                </div>

                <div className="border rounded-xl p-4 space-y-4">
                  <div className="grid md:grid-cols-[1.5fr_1fr_1fr_auto] gap-3">
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

                  <details className="border border-gray-200 rounded-xl bg-gray-50/60">
                    <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-[#0d2b5e]">
                      Configuracion de respaldo
                    </summary>
                    <div className="px-4 pb-4 space-y-3">
                      <p className="text-xs text-gray-600">
                        Estos valores solo se usan como respaldo si una carrera no tiene una regla especifica configurada. Los requisitos oficiales deben capturarse en Reglas por carrera.
                      </p>
                      <div className="grid md:grid-cols-3 gap-3">
                        <input
                          type="number"
                          min={1}
                          value={tipoPracticaForm.semestre_requerido ?? ""}
                          onChange={(event) => setTipoPracticaForm({ ...tipoPracticaForm, semestre_requerido: Number(event.target.value) || null })}
                          className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white"
                          placeholder="Periodo requerido global"
                        />
                        <input
                          type="number"
                          min={0}
                          value={tipoPracticaForm.creditos_minimos ?? ""}
                          onChange={(event) => setTipoPracticaForm({ ...tipoPracticaForm, creditos_minimos: Number(event.target.value) || 0 })}
                          className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white"
                          placeholder="Creditos minimos globales"
                        />
                        <input
                          type="number"
                          min={1}
                          value={tipoPracticaForm.horas_requeridas ?? ""}
                          onChange={(event) => setTipoPracticaForm({ ...tipoPracticaForm, horas_requeridas: Number(event.target.value) || null })}
                          className="px-4 py-3 border-2 border-gray-200 rounded-xl text-sm bg-white"
                          placeholder="Horas globales"
                        />
                      </div>
                    </div>
                  </details>
                </div>

                <div className="overflow-x-auto border rounded-xl">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        {["Tipo de practica", "Orden", "Estado", "Acciones"].map((titulo) => (
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
