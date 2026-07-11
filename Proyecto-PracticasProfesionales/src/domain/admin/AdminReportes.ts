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

export interface AdminReportesResponse {
  resumen: Record<string, number>;
  reportes: ReporteAdminItem[];
  distribuciones: Record<string, DistribucionAdmin[]>;
  modulos: string[];
  actividad: ActividadAdmin[];
  contexto: Record<string, number | string | null>;
}
