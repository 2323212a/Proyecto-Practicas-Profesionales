import type {
  CrearIncidenciaInput,
  EstadoIncidencia,
  EvaluacionAlumnoEmpresaInput,
  EvaluacionEmpresaAlumnoInput,
} from "../../domain/seguimiento/SeguimientoPracticas";
import type { SeguimientoPracticasRepository } from "../../domain/seguimiento/SeguimientoPracticasRepository";

export class GestionSeguimientoPracticasUseCase {
  private readonly repository: SeguimientoPracticasRepository;

  constructor(repository: SeguimientoPracticasRepository) {
    this.repository = repository;
  }

  obtenerPlantillaEvaluacionAlumnoEmpresa() {
    return this.repository.obtenerPlantillaEvaluacionAlumnoEmpresa();
  }

  obtenerAlumno(idAlumno: number) {
    return this.repository.obtenerAlumno(idAlumno);
  }

  guardarEvaluacionAlumnoEmpresa(idAlumno: number, datos: EvaluacionAlumnoEmpresaInput) {
    return this.repository.guardarEvaluacionAlumnoEmpresa(idAlumno, datos);
  }

  crearIncidenciaAlumno(idAlumno: number, datos: CrearIncidenciaInput) {
    return this.repository.crearIncidenciaAlumno(idAlumno, datos);
  }

  obtenerUnidad(idEmpresa: number) {
    return this.repository.obtenerUnidad(idEmpresa);
  }

  guardarEvaluacionEmpresaAlumno(idEmpresa: number, datos: EvaluacionEmpresaAlumnoInput) {
    return this.repository.guardarEvaluacionEmpresaAlumno(idEmpresa, datos);
  }

  crearIncidenciaEmpresa(idEmpresa: number, idAsignacion: number, datos: CrearIncidenciaInput) {
    return this.repository.crearIncidenciaEmpresa(idEmpresa, idAsignacion, datos);
  }

  listarIncidenciasCoordinador() {
    return this.repository.listarIncidenciasCoordinador();
  }

  actualizarIncidencia(idIncidencia: number, estado: EstadoIncidencia, respuesta?: string) {
    return this.repository.actualizarIncidencia(idIncidencia, estado, respuesta);
  }
}
