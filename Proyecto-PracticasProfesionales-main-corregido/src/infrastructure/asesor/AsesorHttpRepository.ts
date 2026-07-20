import type {
  AlumnosAsignadosAsesorResponse,
  AlumnoEvaluacionAsesor,
  EstadoReporteAsesor,
  EvaluacionesAsesorResponse,
  GuardarEvaluacionAsesorInput,
  ReporteAsesor,
  ReportesAsesorResponse,
  ResumenAsesor,
} from "../../domain/asesor/Asesor";
import type { AsesorRepository } from "../../domain/asesor/AsesorRepository";
import { apiClient } from "../api/apiClient";

export class AsesorHttpRepository implements AsesorRepository {
  async listarAlumnos(_idAsesor: number): Promise<AlumnosAsignadosAsesorResponse> {
    const response = await apiClient.get<AlumnosAsignadosAsesorResponse>(
      "/asesor/me/alumnos"
    );
    return response.data;
  }

  async obtenerDashboard(_idAsesor: number): Promise<ResumenAsesor> {
    const response = await apiClient.get<ResumenAsesor>(
      "/asesor/me/dashboard"
    );
    return response.data;
  }

  async listarReportes(_idAsesor: number): Promise<ReportesAsesorResponse> {
    const response = await apiClient.get<ReportesAsesorResponse>(
      "/asesor/me/reportes"
    );
    return response.data;
  }

  async cambiarEstadoReporte(
    _idAsesor: number,
    idReporte: number,
    estado: Exclude<EstadoReporteAsesor, "Pendiente">,
    observacion?: string,
    calificacion?: number,
  ): Promise<ReporteAsesor> {
    const response = await apiClient.patch<ReporteAsesor>(
      `/asesor/me/reportes/${idReporte}/estado`,
      { estado, observacion, calificacion },
    );
    return response.data;
  }

  async descargarReporte(idReporte: number): Promise<Blob> {
    const response = await apiClient.get<Blob>(
      `/asesor/me/reportes/${idReporte}/archivo`,
      { responseType: "blob" },
    );
    return response.data;
  }

  async listarEvaluaciones(_idAsesor: number): Promise<EvaluacionesAsesorResponse> {
    const response = await apiClient.get<EvaluacionesAsesorResponse>(
      "/asesor/me/evaluaciones"
    );
    return response.data;
  }

  async guardarEvaluacion(
    _idAsesor: number,
    datos: GuardarEvaluacionAsesorInput,
  ): Promise<AlumnoEvaluacionAsesor> {
    const response = await apiClient.post<AlumnoEvaluacionAsesor>(
      "/asesor/me/evaluaciones",
      datos,
    );
    return response.data;
  }
}
