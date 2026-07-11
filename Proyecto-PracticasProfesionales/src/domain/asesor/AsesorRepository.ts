import type {
  AlumnosAsignadosAsesorResponse,
  AlumnoEvaluacionDocente,
  EstadoReporteAsesor,
  EvaluacionesDocenteResponse,
  GuardarEvaluacionDocenteInput,
  ReporteAsesor,
  ReportesAsesorResponse,
  ResumenAsesor,
} from "./Asesor";

export interface AsesorRepository {
  listarAlumnos(idDocente: number): Promise<AlumnosAsignadosAsesorResponse>;
  obtenerDashboard(idDocente: number): Promise<ResumenAsesor>;
  listarReportes(idDocente: number): Promise<ReportesAsesorResponse>;
  cambiarEstadoReporte(
    idDocente: number,
    idReporte: number,
    estado: Exclude<EstadoReporteAsesor, "Pendiente">,
    observacion?: string,
  ): Promise<ReporteAsesor>;
  listarEvaluaciones(idDocente: number): Promise<EvaluacionesDocenteResponse>;
  guardarEvaluacion(
    idDocente: number,
    datos: GuardarEvaluacionDocenteInput,
  ): Promise<AlumnoEvaluacionDocente>;
}
