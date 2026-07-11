export interface DireccionResumen {
  alumnos: number;
  en_practicas: number;
  concluidos: number;
  rezagados: number;
  empresas_activas: number;
  convenios_vigentes: number;
  convenios_por_vencer: number;
  horas_registradas: number;
  documentos: number;
  incidencias: number;
  expedientes: number;
}

export interface DireccionContexto {
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

export interface DireccionIndicadoresResponse {
  contexto: DireccionContexto;
  resumen: DireccionResumen;
  alumnos_por_carrera: AlumnosPorCarrera[];
  alumnos_por_estado: SerieNombreTotal[];
  empresas_por_estado: SerieNombreTotal[];
  convenios_por_estado: SerieNombreTotal[];
  documentos_por_estado: SerieNombreTotal[];
  incidencias_por_tipo: SerieNombreTotal[];
  horas_por_mes: HorasPorMes[];
  convocatorias: DireccionConvocatoria[];
  reportes: DireccionReporte[];
}
