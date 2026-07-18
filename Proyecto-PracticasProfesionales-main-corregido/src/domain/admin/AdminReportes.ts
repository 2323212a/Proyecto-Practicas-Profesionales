export interface ReporteAdminItem {
  clave: string;
  titulo: string;
  descripcion: string;
  total: number;
}

export interface ActividadAdmin {
  id_bitacora: number;
  fecha: string | null;
  usuario: string;
  accion: string;
  modulo: string;
  detalle: string | null;
  estado: string;
}

export interface DistribucionAdmin {
  nombre: string;
  total: number;
}

export type AdminReporteTablaValor = string | number | boolean | null;

export type AdminReporteTablaFila = Record<string, AdminReporteTablaValor>;

export interface AdminReportesFiltros {
  periodo?: string;
  modulo?: string;
  rol?: string;
  estado_usuario?: string;
  busqueda?: string;
  carrera?: string;
  semestre?: string;
  grupo?: string;
  tipo_practica?: string;
  periodo_practica?: string;
  estado_empresa?: string;
  tipo_tramite?: string;
  tipo_periodo?: string;
  estado_convocatoria?: string;
}

export interface AdminReportesResponse {
  resumen: Record<string, number>;
  reportes: ReporteAdminItem[];
  distribuciones: Record<string, DistribucionAdmin[]>;
  modulos: string[];
  actividad: ActividadAdmin[];
  contexto: Record<string, number | string | null>;
  tablas?: Record<string, AdminReporteTablaFila[]>;
  filtros?: Record<string, string>;
}
