import type {
  AlumnosAsignadosAsesorResponse,
  AlumnoEvaluacionDocente,
  EstadoReporteAsesor,
  EvaluacionesDocenteResponse,
  GuardarEvaluacionDocenteInput,
  ReporteAsesor,
  ReportesAsesorResponse,
  ResumenAsesor,
} from "../../domain/asesor/Asesor";
import type { AsesorRepository } from "../../domain/asesor/AsesorRepository";
import { apiClient } from "../api/apiClient";

export class AsesorHttpRepository implements AsesorRepository {
  async listarAlumnos(idDocente: number): Promise<AlumnosAsignadosAsesorResponse> {
    const response = await apiClient.get<AlumnosAsignadosAsesorResponse>(
      "/asesor/me/alumnos"
    );
    return response.data;
  }

  async obtenerDashboard(idDocente: number): Promise<ResumenAsesor> {
    const response = await apiClient.get<ResumenAsesor>(
      "/asesor/me/dashboard"
    );
    return response.data;
  }

  async listarReportes(idDocente: number): Promise<ReportesAsesorResponse> {
    const response = await apiClient.get<ReportesAsesorResponse>(
      "/asesor/me/reportes"
    );
    return response.data;
  }

  async cambiarEstadoReporte(
    idDocente: number,
    idReporte: number,
    estado: Exclude<EstadoReporteAsesor, "Pendiente">,
    observacion?: string,
  ): Promise<ReporteAsesor> {
    const response = await apiClient.patch<ReporteAsesor>(
      `/asesor/me/reportes/${idReporte}/estado`,
      { estado, observacion },
    );
    return response.data;
  }

  async listarEvaluaciones(idDocente: number): Promise<EvaluacionesDocenteResponse> {
    const response = await apiClient.get<EvaluacionesDocenteResponse>(
      "/asesor/me/evaluaciones"
    );
    return response.data;
  }

  async guardarEvaluacion(
    idDocente: number,
    datos: GuardarEvaluacionDocenteInput,
  ): Promise<AlumnoEvaluacionDocente> {
    const response = await apiClient.post<AlumnoEvaluacionDocente>(
      "/asesor/me/evaluaciones",
      datos,
    );
    return response.data;
  }
}
