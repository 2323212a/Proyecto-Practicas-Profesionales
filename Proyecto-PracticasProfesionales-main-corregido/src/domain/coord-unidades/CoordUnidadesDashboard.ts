export interface CoordUnidadesResumen {
  solicitudes_nuevas?: number;
  empresas_pendientes: number;
  empresas_rechazadas?: number;
  documentos_pendientes: number;
  convenios_pendientes?: number;
  vacantes_pendientes?: number;
  vacantes_prepadron?: number;
  vacantes_activas: number;
  vacantes_publicables: number;
  cupos_ocupados: number;
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
