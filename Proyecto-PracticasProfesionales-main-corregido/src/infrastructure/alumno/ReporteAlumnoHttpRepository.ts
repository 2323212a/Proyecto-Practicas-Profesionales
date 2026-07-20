import type {
  ReporteAlumno,
  ReportesAlumnoResponse,
  SubirReporteAlumnoInput,
} from "../../domain/alumno/ReporteAlumno";
import type { ReporteAlumnoRepository } from "../../domain/alumno/ReporteAlumnoRepository";
import { apiClient } from "../api/apiClient";

export class ReporteAlumnoHttpRepository implements ReporteAlumnoRepository {
  async listar(_idAlumno: number): Promise<ReportesAlumnoResponse> {
    const { data } = await apiClient.get<ReportesAlumnoResponse>("/alumno/reportes/me/");
    return data;
  }

  async subir(_idAlumno: number, datos: SubirReporteAlumnoInput): Promise<ReporteAlumno> {
    const { data } = await apiClient.post<ReporteAlumno>("/alumno/reportes/me/subir", datos);
    return data;
  }

  async descargar(idReporte: number): Promise<Blob> {
    const { data } = await apiClient.get<Blob>(
      `/alumno/reportes/reportes/${idReporte}/archivo`,
      { responseType: "blob" },
    );
    return data;
  }
}
