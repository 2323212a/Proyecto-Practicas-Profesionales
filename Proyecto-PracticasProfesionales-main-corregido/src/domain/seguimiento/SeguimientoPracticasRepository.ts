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
} from "./SeguimientoPracticas";

export interface SeguimientoPracticasRepository {
  obtenerPlantillaEvaluacionAlumnoEmpresa(): Promise<PlantillaEvaluacionAlumnoEmpresa>;
  obtenerAlumno(idAlumno: number): Promise<SeguimientoAlumnoResponse>;
  guardarEvaluacionAlumnoEmpresa(idAlumno: number, datos: EvaluacionAlumnoEmpresaInput): Promise<EvaluacionAlumnoEmpresa>;
  crearIncidenciaAlumno(idAlumno: number, datos: CrearIncidenciaInput): Promise<IncidenciaPractica>;
  obtenerUnidad(idEmpresa: number): Promise<SeguimientoUnidadResponse>;
  guardarEvaluacionEmpresaAlumno(idEmpresa: number, datos: EvaluacionEmpresaAlumnoInput): Promise<EvaluacionEmpresaAlumno>;
  crearIncidenciaEmpresa(idEmpresa: number, idAsignacion: number, datos: CrearIncidenciaInput): Promise<IncidenciaPractica>;
  listarIncidenciasCoordinador(): Promise<IncidenciasCoordinadorResponse>;
  actualizarIncidencia(idIncidencia: number, estado: EstadoIncidencia, respuesta?: string): Promise<IncidenciaPractica>;
}
