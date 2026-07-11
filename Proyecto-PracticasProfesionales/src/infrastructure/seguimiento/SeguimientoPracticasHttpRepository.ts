import type {
  CrearIncidenciaInput,
  EstadoIncidencia,
  EvaluacionAlumnoEmpresa,
  EvaluacionAlumnoEmpresaInput,
  EvaluacionEmpresaAlumno,
  EvaluacionEmpresaAlumnoInput,
  IncidenciaPractica,
  IncidenciasCoordinadorResponse,
  PlantillaEvaluacionAlumnoEmpresa,
  SeguimientoAlumnoResponse,
  SeguimientoUnidadResponse,
} from "../../domain/seguimiento/SeguimientoPracticas";
import type { SeguimientoPracticasRepository } from "../../domain/seguimiento/SeguimientoPracticasRepository";
import { apiClient } from "../api/apiClient";

export class SeguimientoPracticasHttpRepository implements SeguimientoPracticasRepository {
  async obtenerPlantillaEvaluacionAlumnoEmpresa(): Promise<PlantillaEvaluacionAlumnoEmpresa> {
    const { data } = await apiClient.get<PlantillaEvaluacionAlumnoEmpresa>(
      "/alumno/seguimiento/plantilla-evaluacion-empresa"
    );
    return data;
  }

  async obtenerAlumno(idAlumno: number): Promise<SeguimientoAlumnoResponse> {
    const { data } = await apiClient.get<SeguimientoAlumnoResponse>("/alumno/seguimiento/me");
    return data;
  }

  async guardarEvaluacionAlumnoEmpresa(idAlumno: number, datos: EvaluacionAlumnoEmpresaInput): Promise<EvaluacionAlumnoEmpresa> {
    const { data } = await apiClient.post<EvaluacionAlumnoEmpresa>("/alumno/seguimiento/me/evaluacion-empresa", datos);
    return data;
  }

  async crearIncidenciaAlumno(idAlumno: number, datos: CrearIncidenciaInput): Promise<IncidenciaPractica> {
    const { data } = await apiClient.post<IncidenciaPractica>("/alumno/seguimiento/me/incidencias", datos);
    return data;
  }

  async obtenerUnidad(idEmpresa: number): Promise<SeguimientoUnidadResponse> {
    const { data } = await apiClient.get<SeguimientoUnidadResponse>("/unidad/me/seguimiento");
    return data;
  }

  async guardarEvaluacionEmpresaAlumno(idEmpresa: number, datos: EvaluacionEmpresaAlumnoInput): Promise<EvaluacionEmpresaAlumno> {
    const { data } = await apiClient.post<EvaluacionEmpresaAlumno>("/unidad/me/evaluaciones", datos);
    return data;
  }

  async crearIncidenciaEmpresa(idEmpresa: number, idAsignacion: number, datos: CrearIncidenciaInput): Promise<IncidenciaPractica> {
    const { data } = await apiClient.post<IncidenciaPractica>(`/unidad/me/incidencias/${idAsignacion}`, datos);
    return data;
  }

  async listarIncidenciasCoordinador(): Promise<IncidenciasCoordinadorResponse> {
    const { data } = await apiClient.get<IncidenciasCoordinadorResponse>("/coordinador/incidencias");
    return data;
  }

  async actualizarIncidencia(idIncidencia: number, estado: EstadoIncidencia, respuesta?: string): Promise<IncidenciaPractica> {
    const { data } = await apiClient.patch<IncidenciaPractica>(`/coordinador/incidencias/${idIncidencia}`, {
      estado,
      respuesta_coordinacion: respuesta,
    });
    return data;
  }
}
