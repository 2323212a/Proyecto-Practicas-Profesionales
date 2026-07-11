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

export class GestionAsesorUseCase {
  private readonly repository: AsesorRepository;

  constructor(repository: AsesorRepository) {
    this.repository = repository;
  }

  listarAlumnos(idDocente: number): Promise<AlumnosAsignadosAsesorResponse> {
    return this.repository.listarAlumnos(idDocente);
  }

  obtenerDashboard(idDocente: number): Promise<ResumenAsesor> {
    return this.repository.obtenerDashboard(idDocente);
  }

  listarReportes(idDocente: number): Promise<ReportesAsesorResponse> {
    return this.repository.listarReportes(idDocente);
  }

  cambiarEstadoReporte(
    idDocente: number,
    idReporte: number,
    estado: Exclude<EstadoReporteAsesor, "Pendiente">,
    observacion?: string,
  ): Promise<ReporteAsesor> {
    return this.repository.cambiarEstadoReporte(idDocente, idReporte, estado, observacion);
  }

  listarEvaluaciones(idDocente: number): Promise<EvaluacionesDocenteResponse> {
    return this.repository.listarEvaluaciones(idDocente);
  }

  guardarEvaluacion(
    idDocente: number,
    datos: GuardarEvaluacionDocenteInput,
  ): Promise<AlumnoEvaluacionDocente> {
    return this.repository.guardarEvaluacion(idDocente, datos);
  }
}
