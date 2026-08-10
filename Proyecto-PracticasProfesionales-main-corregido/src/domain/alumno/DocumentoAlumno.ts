export type EstadoDocumentoFlujo = "Pendiente" | "Aprobado" | "Observado" | "Rechazado";

export interface ObservacionDocumentoAlumno {
  id_observacion: number;
  id_usuario: number;
  usuario: string;
  descripcion: string;
  tipo_observacion: "Documento observado" | "Corrección solicitada" | "Documento rechazado" | "Revisión manual";
  fecha_observacion: string | null;
}

export interface DocumentoFlujoAlumno {
  id_documento: number;
  id_tipo_documento: number;
  nombre: string;
  descripcion: string | null;
  instrucciones: string | null;
  etapa: "elegibilidad" | "expediente" | "seleccion_empresa" | "asignacion" | "asignacion_firmada" | string | null;
  obligatorio: boolean;
  nombre_archivo: string | null;
  ruta_archivo: string | null;
  estado: EstadoDocumentoFlujo;
  fecha_carga: string | null;
  generado_por_sistema: boolean;
  codigo_generacion: string | null;
  puede_descargar_generado: boolean;
  habilitado: boolean;
  nomenclatura: string;
  url_archivo: string | null;
  observaciones: ObservacionDocumentoAlumno[];
  ultima_observacion: ObservacionDocumentoAlumno | null;
}

export interface DocumentacionAlumnoResponse {
  alumno?: {
    id_alumno: number;
    id_usuario: number;
    nombre: string;
    apellido_paterno: string | null;
    apellido_materno: string | null;
    correo: string | null;
    matricula: string;
    semestre: number | null;
    grupo: string | null;
    creditos_aprobados: number | null;
    estado_alumno: string | null;
    carrera: string | null;
  };
  expediente: {
    id_expediente?: number;
    estado?: string;
    elegibilidad_aprobada?: boolean;
    expediente_inicial_aprobado: boolean;
    seleccion_habilitada: boolean;
    seleccion_validada: boolean;
    asignacion_habilitada: boolean;
  };
  convocatoria?: ConvocatoriaDisponibleAlumno;
  resumen: {
    aprobados: number;
    revision: number;
    observados: number;
    pendientes: number;
    total: number;
  };
  documentos: DocumentoFlujoAlumno[];
}

export interface ConvocatoriaDisponibleAlumno {
  id_convocatoria: number;
  nombre: string;
  tipo_periodo: string;
  estado: string;
  puede_inscribirse: boolean;
  mensaje_inscripcion: string | null;
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
}

export interface ConvocatoriasDisponiblesAlumnoResponse {
  convocatorias: ConvocatoriaDisponibleAlumno[];
  mensaje: string | null;
}

export interface DocumentoAlumno {
  id_documento: number;
  id_expediente: number;
  id_tipo_documento: number;
  nombre_archivo: string;
  ruta_archivo: string;
  url: string;
  estado_documento: string;
  fecha_carga: string;
  generado_por_sistema: boolean;
  requiere_validacion_automatica: boolean;
  validacion_automatica_estado: string;
  fecha_validacion_automatica: string | null;
  ultima_observacion: string | null;
}

export interface TipoDocumentoAlumno {
  id_tipo_documento: number;
  nombre_documento: string;
  descripcion: string | null;
  etapa: string;
  obligatorio: boolean;
  requiere_formato: boolean;
  requiere_validacion_automatica: boolean;
  documento: DocumentoAlumno | null;
}

export interface DocumentosAlumnoResponse {
  id_expediente: number;
  estado_expediente: string;
  tipos_documento: TipoDocumentoAlumno[];
}

export interface SubirDocumentoAlumnoRequest {
  id_tipo_documento: number;
  nombre_archivo: string;
  contenido_base64: string;
  mime_type: string;
}
