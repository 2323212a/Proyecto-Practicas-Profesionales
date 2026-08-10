export interface VacanteRevision {
  id_vacante: number;
  id_empresa: number;
  empresa: string;
  estado_empresa: string;
  id_convocatoria: number;
  convocatoria: string | null;
  id_tipo_practica: number;
  tipo_practica: string | null;
  titulo: string;
  descripcion: string | null;
  actividades: string | null;
  requisitos: string | null;
  cupos: number;
  cupo_ocupado: number;
  estado_vacante: string;
  observaciones: string | null;
  periodo: string | null;
  publicable: boolean;
  aplica_todas_carreras?: boolean;
  carreras?: Array<{
    id_carrera: number;
    nombre: string;
  }>;
  tipos_practica?: Array<{
    id_tipo_practica: number;
    nombre?: string | null;
    cupos: number;
    cupos_usados: number;
    cupos_disponibles: number;
  }>;
  solicitudes_ampliacion?: Array<{
    id_solicitud_ampliacion: number;
    id_tipo_practica?: number | null;
    tipo_practica?: string | null;
    cupos_solicitados: number;
    motivo: string;
    estado: string;
    fecha_solicitud?: string | null;
    observaciones?: string | null;
    detalles?: Array<{
      id_detalle_ampliacion?: number | null;
      id_tipo_practica: number;
      tipo_practica?: string | null;
      cupos_solicitados: number;
      cupos_aprobados?: number | null;
      estado: string;
      observaciones?: string | null;
    }>;
  }>;
  plan_trabajo?: {
    id_documento_vacante: number;
    nombre_archivo: string;
    estado_documento: string;
    observaciones?: string | null;
    fecha_subida?: string | null;
    fecha_revision?: string | null;
    activo?: boolean;
    url_descarga?: string;
  } | null;
}
