export interface EmpresaVacantesUnidad {
  id_empresa: number;
  nombre_empresa: string;
  estado_empresa: string;
  tipo_tramite?: string | null;
  puede_publicar: boolean;
  documentacion_legal_aprobada?: boolean;
  convenio_vigente?: boolean;
  convenio_estado?: string | null;
  vinculacion_aprobada?: boolean;
  tramite_vigente?: boolean;
  estado_documentacion_legal?: string;
  estado_tramite?: string;
  puede_capturar_vacantes?: boolean;
  puede_solicitar_participacion?: boolean;
  puede_crear_vacante?: boolean;
  motivo_bloqueo_participacion?: string | null;
  motivo_bloqueo_vacante?: string | null;
  motivo_bloqueo: string | null;
}

export interface VacanteUnidad {
  id_vacante: number;
  id_empresa: number;
  id_convocatoria: number;
  id_tipo_practica: number;
  titulo: string;
  descripcion: string | null;
  actividades: string | null;
  requisitos: string | null;
  cupos: number;
  estado_vacante: string;
  visible_padron?: boolean;
  periodo?: "Semestral" | "Cuatrimestral" | null;
  tipo_practica?: string | null;
  convocatoria?: string | null;
  observaciones?: string | null;
  fecha_revision?: string | null;
  revisada_por?: number | null;
  plan_trabajo?: DocumentoPlanTrabajoVacante | null;
  formato_plan_trabajo?: FormatoPlanTrabajoVacante | null;
  historial_plan_trabajo?: DocumentoPlanTrabajoVacante[];
  aplica_todas_carreras?: boolean;
  carreras?: Array<{
    id_carrera: number;
    nombre: string;
  }>;
  tipos_practica?: Array<{
    id_tipo_practica: number;
    nombre?: string | null;
    cupos: number;
    cupos_usados?: number;
    cupos_disponibles?: number;
    activo?: boolean;
  }>;
  solicitudes_ampliacion?: Array<{
    id_solicitud_ampliacion: number;
    id_tipo_practica: number;
    cupos_solicitados: number;
    motivo: string;
    estado: "Pendiente" | "Aprobada" | "Rechazada" | string;
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
}

export interface DocumentoPlanTrabajoVacante {
  id_documento_vacante: number;
  tipo_documento?: "Plan de trabajo" | string;
  nombre_archivo: string;
  estado_documento: "Pendiente" | "Aprobado" | "Observado" | "Rechazado" | string;
  observaciones?: string | null;
  fecha_subida?: string | null;
  fecha_revision?: string | null;
  activo?: boolean;
  url_descarga?: string;
}

export interface FormatoPlanTrabajoVacante {
  id_formato_plan: number;
  id_convocatoria?: number | null;
  nombre: string;
  descripcion?: string | null;
  nombre_archivo: string;
  activo: boolean;
  fecha_subida?: string | null;
  url_descarga?: string;
}

export interface VacantesUnidadResponse {
  empresa: EmpresaVacantesUnidad;
  convocatoria_disponible?: ConvocatoriaBasica | null;
  participacion_actual?: {
    id_participacion: number;
    id_convocatoria: number;
    convocatoria?: string | null;
    estado: "Pendiente" | "Aceptada" | "Rechazada" | "Cerrada" | string;
    observaciones?: string | null;
    motivo_rechazo?: string | null;
  } | null;
  vacantes: VacanteUnidad[];
}

export interface CrearVacanteUnidadInput {
  id_convocatoria: number;
  id_tipo_practica?: number;
  titulo: string;
  descripcion?: string;
  actividades?: string;
  requisitos?: string;
  cupos?: number;
  aplica_todas_carreras?: boolean;
  ids_carrera?: number[];
  tipos_practica?: Array<{
    id_tipo_practica: number;
    cupos: number;
  }>;
}

export interface ConvocatoriaBasica {
  id_convocatoria: number;
  nombre: string;
  tipo_periodo: "Semestral" | "Cuatrimestral";
  estado: string;
  fase_actual?: string;
  fecha_inicio_general?: string | null;
  fecha_cierre_general?: string | null;
  fecha_inicio_empresas?: string | null;
  fecha_cierre_empresas?: string | null;
}

export interface ConvocatoriaDisponibleUnidad extends ConvocatoriaBasica {
  etapa_actual: string;
  participacion?: {
    id_participacion: number;
    estado: string;
    motivo_rechazo?: string | null;
  } | null;
  vacante?: {
    id_vacante: number;
    titulo: string;
    estado_vacante: string;
  } | null;
  puede_seleccionar: boolean;
  motivo_bloqueo?: string | null;
}
