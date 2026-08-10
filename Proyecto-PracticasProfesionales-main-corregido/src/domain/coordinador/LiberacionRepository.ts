import type { AlumnoLiberacion, AnexarLiberacionPayload, LiberacionAlumnoResponse, LiberacionResponse } from "./Liberacion";

export interface LiberacionRepository {
  listar(): Promise<LiberacionResponse>;
  emitir(idAsignacion: number): Promise<AlumnoLiberacion>;
  anexarDocumento(idAsignacion: number, payload: AnexarLiberacionPayload): Promise<AlumnoLiberacion>;
  obtenerAlumno(idAlumno: number): Promise<LiberacionAlumnoResponse>;
  descargarDocumento(idLiberacion: number): Promise<Blob>;
}
