import type { DocumentacionAlumnoResponse, DocumentoFlujoAlumno, EstadoDocumentoFlujo } from "../alumno/DocumentoAlumno";

export interface AlumnoResumenRevision {
  id_alumno: number;
  id_expediente: number;
  nombre: string;
  correo: string | null;
  matricula: string;
  semestre: number | null;
  grupo: string | null;
  carrera: string | null;
  estado_alumno: string | null;
  estado_expediente: string;
  resumen: {
    aprobados: number;
    cargados: number;
    revision: number;
    observados: number;
    total: number;
  };
}

export type DetalleRevisionAlumno = Required<Pick<DocumentacionAlumnoResponse, "alumno">> & DocumentacionAlumnoResponse;
export type DocumentoRevisionFlujo = DocumentoFlujoAlumno;
export type EstadoRevisionDocumento = EstadoDocumentoFlujo;

export interface AlumnoRevision {
  id_alumno: number;
  id_expediente: number | null;
  alumno: string;
  matricula: string;
  carrera: string;
  estado_expediente: string;
  estado_alumno: string;
  pendientes: number;
  completados: number;
  observados: number;
  faltantes: number;
  enviados: number;
  total: number;
  estado_recepcion: "Pendiente" | "Completado" | "Sin documentos enviados";
}

export interface DocumentoRevision {
  id_documento: number;
  id_expediente: number;
  id_tipo_documento: number;
  tipo_documento: string;
  etapa: string;
  nombre_archivo: string;
  ruta_archivo: string;
  url: string;
  estado_documento: string;
  fecha_carga: string;
  validacion_automatica_estado: string;
  requiere_validacion_automatica: boolean;
  id_alumno: number;
  alumno: string;
  matricula: string;
  carrera: string;
  estado_expediente: string;
  estado_alumno: string;
  ultima_observacion: string | null;
  observaciones: Array<{
    id_observacion: number;
    id_usuario: number;
    usuario: string;
    descripcion: string;
    tipo_observacion: "Documento observado" | "Corrección solicitada" | "Documento rechazado" | "Revisión manual";
    fecha_observacion: string | null;
  }>;
}

export interface FormatoDocumento {
  id_formato: number;
  id_tipo_documento: number;
  tipo_documento: string;
  etapa: string;
  nombre_archivo: string;
  url: string;
  mime_type: string;
  descripcion: string | null;
  activo: boolean;
  fecha_actualizacion: string;
}

export interface TipoDocumentoResumen {
  id_tipo_documento: number;
  nombre_documento: string;
  descripcion: string | null;
  etapa: string;
  obligatorio: boolean;
  requiere_formato: boolean;
}

export interface RevisionDocumentalResponse {
  alumnos: AlumnoRevision[];
  documentos: DocumentoRevision[];
  formatos: FormatoDocumento[];
  tipos_documento: TipoDocumentoResumen[];
}

export interface CambiarEstadoDocumentoRequest {
  estado: "Pendiente" | "Aprobado" | "Observado" | "Rechazado";
  comentario?: string | null;
  id_usuario?: number;
}

export interface SubirFormatoRequest {
  id_tipo_documento: number;
  nombre_archivo: string;
  contenido_base64: string;
  mime_type: string;
  descripcion?: string | null;
}

export interface NotaCoordinadorRequest {
  nota: string;
  tipo_observacion?: "Documento observado" | "Corrección solicitada" | "Documento rechazado" | "Revisión manual";
  notificar_alumno?: boolean;
}
