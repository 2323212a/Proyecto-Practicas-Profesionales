import type {
  DocumentacionAlumnoResponse,
  DocumentosAlumnoResponse,
  SubirDocumentoAlumnoRequest,
} from "../../domain/alumno/DocumentoAlumno";
import type { DocumentoAlumnoRepository } from "../../domain/alumno/DocumentoAlumnoRepository";

export class GestionDocumentosAlumnoUseCase {
  private readonly repository: DocumentoAlumnoRepository;

  constructor(repository: DocumentoAlumnoRepository) {
    this.repository = repository;
  }

  listar(idAlumno: number): Promise<DocumentosAlumnoResponse> {
    return this.repository.listar(idAlumno);
  }

  subir(idAlumno: number, datos: SubirDocumentoAlumnoRequest): Promise<void> {
    return this.repository.subir(idAlumno, datos);
  }

  obtenerDocumentacion(): Promise<DocumentacionAlumnoResponse> {
    return this.repository.obtenerDocumentacion();
  }

  subirArchivo(idDocumento: number, archivo: File): Promise<DocumentacionAlumnoResponse> {
    return this.repository.subirArchivo(idDocumento, archivo);
  }

  descargarArchivo(idDocumento: number): Promise<Blob> {
    return this.repository.descargarArchivo(idDocumento);
  }

  descargarGenerado(codigo: string): Promise<Blob> {
    return this.repository.descargarGenerado(codigo);
  }
}
