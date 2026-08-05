import type {
  AlumnoResumenRevision,
  CambiarEstadoDocumentoRequest,
  DetalleRevisionAlumno,
  FormatoDocumento,
  NotaCoordinadorRequest,
  RevisionDocumentalResponse,
  SubirFormatoRequest,
} from "../../domain/documento/RevisionDocumental";
import type { RevisionDocumentalRepository } from "../../domain/documento/RevisionDocumentalRepository";

export class GestionRevisionDocumentalUseCase {
  private readonly repository: RevisionDocumentalRepository;

  constructor(repository: RevisionDocumentalRepository) {
    this.repository = repository;
  }

  listarRevision(): Promise<RevisionDocumentalResponse> {
    return this.repository.listarRevision();
  }

  listarFormatos(): Promise<FormatoDocumento[]> {
    return this.repository.listarFormatos();
  }

  cambiarEstado(idDocumento: number, datos: CambiarEstadoDocumentoRequest): Promise<void> {
    return this.repository.cambiarEstado(idDocumento, datos);
  }

  subirFormato(datos: SubirFormatoRequest): Promise<FormatoDocumento> {
    return this.repository.subirFormato(datos);
  }

  listarAlumnosFlujo(): Promise<AlumnoResumenRevision[]> {
    return this.repository.listarAlumnosFlujo();
  }

  obtenerDetalleAlumno(idAlumno: number): Promise<DetalleRevisionAlumno> {
    return this.repository.obtenerDetalleAlumno(idAlumno);
  }

  agregarNotaDocumento(idDocumento: number, datos: NotaCoordinadorRequest): Promise<void> {
    return this.repository.agregarNotaDocumento(idDocumento, datos);
  }

  agregarNotaAlumno(idAlumno: number, datos: NotaCoordinadorRequest): Promise<void> {
    return this.repository.agregarNotaAlumno(idAlumno, datos);
  }

  habilitarSeleccion(idAlumno: number): Promise<DetalleRevisionAlumno> {
    return this.repository.habilitarSeleccion(idAlumno);
  }

  habilitarAsignacion(idAlumno: number): Promise<DetalleRevisionAlumno> {
    return this.repository.habilitarAsignacion(idAlumno);
  }

  descargarDocumentoFlujo(idDocumento: number): Promise<Blob> {
    return this.repository.descargarDocumentoFlujo(idDocumento);
  }
}
