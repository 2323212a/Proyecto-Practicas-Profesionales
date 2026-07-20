import type { AlumnoLiberacion, AnexarLiberacionPayload, LiberacionAlumnoResponse, LiberacionResponse } from "../../domain/coordinador/Liberacion";
import type { LiberacionRepository } from "../../domain/coordinador/LiberacionRepository";
import { apiClient } from "../api/apiClient";

export class LiberacionHttpRepository implements LiberacionRepository {
  async listar(): Promise<LiberacionResponse> {
    const { data } = await apiClient.get<LiberacionResponse>("/coordinador/liberacion/");
    return data;
  }

  async emitir(idAsignacion: number): Promise<AlumnoLiberacion> {
    const { data } = await apiClient.post<AlumnoLiberacion>(`/coordinador/liberacion/${idAsignacion}/emitir`);
    return data;
  }

  async anexarDocumento(idAsignacion: number, payload: AnexarLiberacionPayload): Promise<AlumnoLiberacion> {
    const { data } = await apiClient.post<AlumnoLiberacion>(`/coordinador/liberacion/${idAsignacion}/documento`, payload);
    return data;
  }

  async obtenerAlumno(_idAlumno: number): Promise<LiberacionAlumnoResponse> {
    const { data } = await apiClient.get<LiberacionAlumnoResponse>("/coordinador/liberacion/alumno/me");
    return data;
  }

  async descargarDocumento(idLiberacion: number): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(
      `/coordinador/liberacion/documentos/${idLiberacion}/archivo`,
      { responseType: "blob" },
    );
    return data;
  }
}
