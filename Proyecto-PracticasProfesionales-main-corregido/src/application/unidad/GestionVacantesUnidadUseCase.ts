import type {
  ActualizarVacanteUnidadInput,
  CarreraBasica,
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

  actualizar(idEmpresa: number, idVacante: number, datos: ActualizarVacanteUnidadInput): Promise<VacanteUnidad> {
    return this.repository.actualizar(idEmpresa, idVacante, datos);
  }

  listarCarreras(): Promise<CarreraBasica[]> {
    return this.repository.listarCarreras();
  }
}
