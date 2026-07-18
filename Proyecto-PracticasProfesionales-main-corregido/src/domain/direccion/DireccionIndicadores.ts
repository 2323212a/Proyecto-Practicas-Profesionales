export interface DireccionResumen {
  alumnos: number;
  alumnos_en_proceso: number;
  alumnos_asignados: number;
  alumnos_sin_asignacion: number;
  empresas: number;
  empresas_activas: number;
  empresas_pendientes: number;
  convenios: number;
  convenios_vigentes: number;
  convenios_por_vencer: number;
  convenios_vencidos: number;
  vacantes: number;
  vacantes_publicadas: number;
  vacantes_prepadron: number;
  convocatorias: number;
  incidencias_abiertas: number;
  horas_registradas: number;
}

export interface DireccionContexto {
  nombre_sistema: string;
  escuela_facultad: string;
  convocatoria_activa: string | null;
  fecha_actualizacion: string;
}

export interface SerieNombreTotal {
  nombre: string;
  total: number;
}

export interface AlumnosPorCarrera {
  carrera: string;
  alumnos: number;
}

export interface HorasPorMes {
  mes: string;
  horas: number;
}

export interface DireccionConvocatoria {
  convocatoria: string;
  periodo: string;
  tipo_periodo: string;
  alumnos: number;
  empresas: number;
  convenios: number;
  incidencias: number;
  concluidas: number;
  estado: string;
}

export interface DireccionReporte {
  tipo: string;
  titulo: string;
  descripcion: string;
  registros: number;
}

export interface DireccionCatalogos {
  convocatorias: string[];
  carreras: string[];
  tipos_practica: string[];
  periodos_practica: string[];
  semestres: number[];
  grupos: string[];
  estados_empresa: string[];
  estados_vacante: string[];
  estados_convenio: string[];
  tipos_tramite: string[];
  periodos_participacion: string[];
  tipos_periodo: string[];
}

export interface DireccionFiltros {
  convocatoria?: string;
  carrera?: string;
  tipo_practica?: string;
  periodo_practica?: string;
  semestre?: number | "";
  grupo?: string;
  estado_empresa?: string;
  estado_vacante?: string;
  estado_convenio?: string;
  tipo_tramite?: string;
  periodo_participacion?: string;
  tipo_periodo?: string;
}

export interface DireccionIndicadoresResponse {
  contexto: DireccionContexto;
  filtros: DireccionFiltros;
  catalogos: DireccionCatalogos;
  resumen: DireccionResumen;
  alumnos_por_carrera: AlumnosPorCarrera[];
  alumnos_por_semestre: SerieNombreTotal[];
  alumnos_por_tipo_practica: SerieNombreTotal[];
  alumnos_por_estado: SerieNombreTotal[];
  empresas_por_estado: SerieNombreTotal[];
  empresas_por_tipo_tramite: SerieNombreTotal[];
  empresas_por_periodo: SerieNombreTotal[];
  convenios_por_estado: SerieNombreTotal[];
  vacantes_por_estado: SerieNombreTotal[];
  vacantes_por_tipo_practica: SerieNombreTotal[];
  vacantes_por_periodo: SerieNombreTotal[];
  convocatorias_por_tipo_periodo: SerieNombreTotal[];
  horas_por_mes: HorasPorMes[];
  convocatorias: DireccionConvocatoria[];
  reportes: DireccionReporte[];
}
