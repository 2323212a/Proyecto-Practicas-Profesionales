import type {
  AlumnosAsignadosAsesorResponse,
  AlumnoEvaluacionAsesor,
  EstadoReporteAsesor,
  EvaluacionesAsesorResponse,
  GuardarEvaluacionAsesorInput,
  ReporteAsesor,
  ReportesAsesorResponse,
  ResumenAsesor,
} from "./Asesor";

export interface AsesorRepository {
  listarAlumnos(idAsesor: number): Promise<AlumnosAsignadosAsesorResponse>;
  obtenerDashboard(idAsesor: number): Promise<ResumenAsesor>;
  listarReportes(idAsesor: number): Promise<ReportesAsesorResponse>;
  cambiarEstadoReporte(
    idAsesor: number,
    idReporte: number,
    estado: Exclude<EstadoReporteAsesor, "Pendiente">,
    observacion?: string,
    calificacion?: number,
  ): Promise<ReporteAsesor>;
  listarEvaluaciones(idAsesor: number): Promise<EvaluacionesAsesorResponse>;
  guardarEvaluacion(
    idAsesor: number,
    datos: GuardarEvaluacionAsesorInput,
  ): Promise<AlumnoEvaluacionAsesor>;
}
