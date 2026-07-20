export type EstadoDocumentoEmpresa = "Pendiente" | "Aprobado" | "Con observaciones" | "Rechazado";

export interface EmpresaDocumentacionInfo {
  id_empresa: number;
  nombre_empresa: string;
  tipo_tramite?: "Convenio" | "Vinculacion" | string | null;
  rfc: string | null;
  giro: string | null;
  domicilio: string | null;
  telefono: string | null;
  correo_contacto: string | null;
  estado_empresa: string;
}

export interface FormatoEmpresa {
  id_formato_empresa: number;
  id_empresa: number | null;
  alcance?: "Todas" | "Empresa";
  empresa_nombre?: string | null;
  nombre_archivo: string;
  url: string;
  version: string | null;
  fecha_subida: string | null;
}

export interface DocumentoEmpresa {
  id_documento_empresa: number;
  id_empresa: number;
  id_tipo_documento_empresa: number;
  nombre_archivo: string;
  url: string;
  estado_documento: EstadoDocumentoEmpresa;
  observaciones: string | null;
  fecha_subida: string | null;
  fecha_revision: string | null;
}

export interface RequisitoEmpresa {
  id_tipo_documento_empresa: number;
  nombre: string;
  descripcion: string | null;
  obligatorio: boolean;
  activo?: boolean;
  requiere_formato: boolean;
  etapa?: "Documentacion" | "Convenio" | "Vinculacion";
  tipo_tramite?: "Convenio" | "Vinculacion" | null;
  puede_eliminar?: boolean;
  formato: FormatoEmpresa | null;
  documento: DocumentoEmpresa | null;
}

export interface ResumenDocumentacionEmpresa {
  total: number;
  aprobados: number;
  pendientes: number;
  rechazados: number;
  faltantes: number;
}

export interface DocumentacionEmpresaResponse {
  empresa: EmpresaDocumentacionInfo;
  resumen: ResumenDocumentacionEmpresa;
  convenio_actual: {
    id_convenio: number;
    fecha_inicio: string;
    fecha_fin: string;
    estado_convenio: string;
    es_actual: boolean;
    observaciones: string | null;
  } | null;
  documentos: RequisitoEmpresa[];
}

export interface ArchivoBase64Input {
  nombre_archivo: string;
  contenido_base64: string;
  mime_type?: string | null;
}

export interface SubirDocumentoEmpresaInput extends ArchivoBase64Input {
  id_tipo_documento_empresa: number;
}

export interface EditarDocumentoEmpresaInput extends ArchivoBase64Input {
  observaciones?: string;
}

export interface SubirFormatoEmpresaInput extends ArchivoBase64Input {
  id_tipo_documento_empresa: number;
  id_empresa?: number | null;
  version?: string;
}

export interface ConfigurarRequisitoEmpresaInput {
  nombre: string;
  descripcion?: string | null;
  obligatorio: boolean;
  requiere_formato: boolean;
  activo: boolean;
  etapa: "Documentacion" | "Convenio" | "Vinculacion";
  tipo_tramite?: "Convenio" | "Vinculacion" | null;
}

export interface RevisarDocumentoEmpresaInput {
  estado_documento: EstadoDocumentoEmpresa;
  observaciones?: string;
  fecha_inicio_convenio?: string;
  fecha_fin_convenio?: string;
}
