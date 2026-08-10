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
import { apiClient } from "../api/apiClient";

export class RevisionDocumentalHttpRepository implements RevisionDocumentalRepository {
  async listarRevision(): Promise<RevisionDocumentalResponse> {
    const { data } = await apiClient.get<RevisionDocumentalResponse>("/coordinador/documentos/revision");
    return data;
  }

  async listarFormatos(): Promise<FormatoDocumento[]> {
    const { data } = await apiClient.get<FormatoDocumento[]>("/coordinador/documentos/formatos");
    return data;
  }

  async cambiarEstado(idDocumento: number, datos: CambiarEstadoDocumentoRequest): Promise<void> {
    await apiClient.patch(`/coordinador/documentos/${idDocumento}/estado`, datos);
  }

  async subirFormato(datos: SubirFormatoRequest): Promise<FormatoDocumento> {
    const { data } = await apiClient.post<FormatoDocumento>("/coordinador/documentos/formatos", datos);
    return data;
  }

  async listarAlumnosFlujo(): Promise<AlumnoResumenRevision[]> {
    const { data } = await apiClient.get<AlumnoResumenRevision[]>("/coordinador/documentos/flujo/alumnos");
    return data;
  }

  async obtenerDetalleAlumno(idAlumno: number): Promise<DetalleRevisionAlumno> {
    const { data } = await apiClient.get<DetalleRevisionAlumno>(`/coordinador/documentos/flujo/alumnos/${idAlumno}`);
    return data;
  }

  async agregarNotaDocumento(idDocumento: number, datos: NotaCoordinadorRequest): Promise<void> {
    await apiClient.post(`/coordinador/documentos/${idDocumento}/nota`, datos);
  }

  async agregarNotaAlumno(idAlumno: number, datos: NotaCoordinadorRequest): Promise<void> {
    await apiClient.post(`/coordinador/documentos/alumnos/${idAlumno}/nota`, datos);
  }

  async habilitarSeleccion(idAlumno: number): Promise<DetalleRevisionAlumno> {
    const { data } = await apiClient.post<DetalleRevisionAlumno>(`/coordinador/documentos/flujo/alumnos/${idAlumno}/habilitar-seleccion`);
    return data;
  }

  async habilitarAsignacion(idAlumno: number): Promise<DetalleRevisionAlumno> {
    const { data } = await apiClient.post<DetalleRevisionAlumno>(`/coordinador/documentos/flujo/alumnos/${idAlumno}/habilitar-asignacion`);
    return data;
  }

  async descargarDocumentoFlujo(idDocumento: number): Promise<Blob> {
    const { data } = await apiClient.get(`/coordinador/documentos/flujo/${idDocumento}/archivo`, {
      responseType: "blob",
    });
    return data;
  }
}
