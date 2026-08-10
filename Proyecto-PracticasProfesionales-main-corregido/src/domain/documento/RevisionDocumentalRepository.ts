import type {
  AlumnoResumenRevision,
  CambiarEstadoDocumentoRequest,
  DetalleRevisionAlumno,
  FormatoDocumento,
  NotaCoordinadorRequest,
  RevisionDocumentalResponse,
  SubirFormatoRequest,
} from "./RevisionDocumental";

export interface RevisionDocumentalRepository {
  listarRevision(): Promise<RevisionDocumentalResponse>;
  listarFormatos(): Promise<FormatoDocumento[]>;
  cambiarEstado(idDocumento: number, datos: CambiarEstadoDocumentoRequest): Promise<void>;
  subirFormato(datos: SubirFormatoRequest): Promise<FormatoDocumento>;
  listarAlumnosFlujo(): Promise<AlumnoResumenRevision[]>;
  obtenerDetalleAlumno(idAlumno: number): Promise<DetalleRevisionAlumno>;
  agregarNotaDocumento(idDocumento: number, datos: NotaCoordinadorRequest): Promise<void>;
  agregarNotaAlumno(idAlumno: number, datos: NotaCoordinadorRequest): Promise<void>;
  habilitarSeleccion(idAlumno: number): Promise<DetalleRevisionAlumno>;
  habilitarAsignacion(idAlumno: number): Promise<DetalleRevisionAlumno>;
  descargarDocumentoFlujo(idDocumento: number): Promise<Blob>;
}
