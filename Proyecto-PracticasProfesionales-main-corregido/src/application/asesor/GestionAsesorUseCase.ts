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

export class GestionAsesorUseCase {
  private readonly repository: AsesorRepository;

  constructor(repository: AsesorRepository) {
    this.repository = repository;
  }

  listarAlumnos(idAsesor: number): Promise<AlumnosAsignadosAsesorResponse> {
    return this.repository.listarAlumnos(idAsesor);
  }

  obtenerDashboard(idAsesor: number): Promise<ResumenAsesor> {
    return this.repository.obtenerDashboard(idAsesor);
  }

  listarReportes(idAsesor: number): Promise<ReportesAsesorResponse> {
    return this.repository.listarReportes(idAsesor);
  }

  cambiarEstadoReporte(
    idAsesor: number,
    idReporte: number,
    estado: Exclude<EstadoReporteAsesor, "Pendiente">,
    observacion?: string,
    calificacion?: number,
  ): Promise<ReporteAsesor> {
    return this.repository.cambiarEstadoReporte(idAsesor, idReporte, estado, observacion, calificacion);
  }

  descargarReporte(idReporte: number): Promise<Blob> {
    return this.repository.descargarReporte(idReporte);
  }

  listarEvaluaciones(idAsesor: number): Promise<EvaluacionesAsesorResponse> {
    return this.repository.listarEvaluaciones(idAsesor);
  }

  guardarEvaluacion(
    idAsesor: number,
    datos: GuardarEvaluacionAsesorInput,
  ): Promise<AlumnoEvaluacionAsesor> {
    return this.repository.guardarEvaluacion(idAsesor, datos);
  }
}
