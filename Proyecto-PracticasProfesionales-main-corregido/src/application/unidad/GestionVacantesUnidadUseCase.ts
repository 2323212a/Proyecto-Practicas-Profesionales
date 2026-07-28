import type {
  ConvocatoriaBasica,
  ConvocatoriaDisponibleUnidad,
  CrearVacanteUnidadInput,
  VacanteUnidad,
  VacantesUnidadResponse,
} from "../../domain/unidad/VacanteUnidad";
import type { VacanteUnidadRepository } from "../../domain/unidad/VacanteUnidadRepository";

export class GestionVacantesUnidadUseCase {
  private readonly repository: VacanteUnidadRepository;

  constructor(repository: VacanteUnidadRepository) {
    this.repository = repository;
  }

  listar(idEmpresa: number): Promise<VacantesUnidadResponse> {
    return this.repository.listar(idEmpresa);
  }

  crear(idEmpresa: number, datos: CrearVacanteUnidadInput): Promise<VacanteUnidad> {
    return this.repository.crear(idEmpresa, datos);
  }

  obtenerDetalle(idVacante: number): Promise<VacanteUnidad> {
    return this.repository.obtenerDetalle(idVacante);
  }

  editar(idVacante: number, datos: CrearVacanteUnidadInput): Promise<VacanteUnidad> {
    return this.repository.editar(idVacante, datos);
  }

  subirPlanTrabajo(idVacante: number, archivo: File): Promise<VacanteUnidad["plan_trabajo"]> {
    return this.repository.subirPlanTrabajo(idVacante, archivo);
  }

  reenviar(idVacante: number): Promise<void> {
    return this.repository.reenviar(idVacante);
  }

  obtenerFormatoPlanTrabajo(idConvocatoria?: number): Promise<VacanteUnidad["formato_plan_trabajo"]> {
    return this.repository.obtenerFormatoPlanTrabajo(idConvocatoria);
  }

  listarConvocatorias(): Promise<ConvocatoriaBasica[]> {
    return this.repository.listarConvocatorias();
  }

  listarConvocatoriasDisponibles(): Promise<ConvocatoriaDisponibleUnidad[]> {
    return this.repository.listarConvocatoriasDisponibles();
  }

  solicitarParticipacion(idConvocatoria: number): Promise<void> {
    return this.repository.solicitarParticipacion(idConvocatoria);
  }
}
