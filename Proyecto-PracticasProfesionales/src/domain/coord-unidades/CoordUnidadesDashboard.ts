export interface CoordUnidadesResumen {
  empresas_pendientes: number;
  documentos_pendientes: number;
  vacantes_activas: number;
  empresas_publicadas: number;
  convenios_por_vencer: number;
}

export interface CoordUnidadesPipelineItem {
  etapa: string;
  cantidad: number;
  detalle: string;
}

export interface CoordUnidadesActividadItem {
  id_bitacora: number;
  texto: string;
  detalle: string | null;
  fecha: string | null;
}

export interface CoordUnidadesDashboardResponse {
  resumen: CoordUnidadesResumen;
  pipeline: CoordUnidadesPipelineItem[];
  actividad: CoordUnidadesActividadItem[];
  alertas: string[];
}
