export type EstadoDocumentoEmpresa = "Pendiente" | "Aprobado" | "Rechazado";

export interface EmpresaDocumentacionInfo {
  id_empresa: number;
  nombre_empresa: string;
  rfc: string | null;
  giro: string | null;
  domicilio: string | null;
  telefono: string | null;
  correo_contacto: string | null;
  estado_empresa: string;
}

export interface FormatoEmpresa {
  id_formato_empresa: number;
  nombre_archivo: string;
  url: string;
  mime_type: string;
  descripcion: string | null;
  fecha_actualizacion: string | null;
}

export interface DocumentoEmpresa {
  id_documento_empresa: number;
  id_empresa: number;
  id_tipo_documento_empresa: number;
  nombre_archivo: string;
  url: string;
  mime_type: string;
  estado_documento: EstadoDocumentoEmpresa;
  observaciones: string | null;
  fecha_carga: string | null;
  fecha_revision: string | null;
}

export interface RequisitoEmpresa {
  id_tipo_documento_empresa: number;
  nombre: string;
  descripcion: string | null;
  obligatorio: boolean;
  requiere_formato: boolean;
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
  documentos: RequisitoEmpresa[];
}

export interface ArchivoBase64Input {
  nombre_archivo: string;
  contenido_base64: string;
  mime_type: string;
}

export interface SubirDocumentoEmpresaInput extends ArchivoBase64Input {
  id_tipo_documento_empresa: number;
}

export interface SubirFormatoEmpresaInput extends ArchivoBase64Input {
  id_tipo_documento_empresa: number;
  descripcion?: string;
}
