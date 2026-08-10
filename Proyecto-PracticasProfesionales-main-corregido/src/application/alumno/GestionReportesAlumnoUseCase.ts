import type {
  ReporteAlumno,
  ReportesAlumnoResponse,
  SubirReporteAlumnoInput,
} from "../../domain/alumno/ReporteAlumno";
import type { ReporteAlumnoRepository } from "../../domain/alumno/ReporteAlumnoRepository";

export class GestionReportesAlumnoUseCase {
  private readonly repository: ReporteAlumnoRepository;

  constructor(repository: ReporteAlumnoRepository) {
    this.repository = repository;
  }

  listar(idAlumno: number): Promise<ReportesAlumnoResponse> {
    return this.repository.listar(idAlumno);
  }

  subir(idAlumno: number, datos: SubirReporteAlumnoInput): Promise<ReporteAlumno> {
    return this.repository.subir(idAlumno, datos);
  }

  descargar(idReporte: number): Promise<Blob> {
    return this.repository.descargar(idReporte);
  }
}
