import type {
  DocumentacionAlumnoResponse,
  DocumentosAlumnoResponse,
  SubirDocumentoAlumnoRequest,
} from "./DocumentoAlumno";

export interface DocumentoAlumnoRepository {
  listar(idAlumno: number): Promise<DocumentosAlumnoResponse>;
  subir(idAlumno: number, datos: SubirDocumentoAlumnoRequest): Promise<void>;
  obtenerDocumentacion(): Promise<DocumentacionAlumnoResponse>;
  subirArchivo(idDocumento: number, archivo: File): Promise<DocumentacionAlumnoResponse>;
  descargarArchivo(idDocumento: number): Promise<Blob>;
  descargarGenerado(codigo: string): Promise<Blob>;
}
