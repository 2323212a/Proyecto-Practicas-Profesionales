import type {
  ReporteAlumno,
  ReportesAlumnoResponse,
  SubirReporteAlumnoInput,
} from "./ReporteAlumno";

export interface ReporteAlumnoRepository {
  listar(idAlumno: number): Promise<ReportesAlumnoResponse>;
  subir(idAlumno: number, datos: SubirReporteAlumnoInput): Promise<ReporteAlumno>;
  descargar(idReporte: number): Promise<Blob>;
}
