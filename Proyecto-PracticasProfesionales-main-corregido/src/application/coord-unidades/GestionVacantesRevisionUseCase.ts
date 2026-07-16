import type { VacanteRevision } from "../../domain/coord-unidades/VacanteRevision";
import type {
  LiberarPrepadronFiltros,
  VacanteRevisionRepository,
} from "../../domain/coord-unidades/VacanteRevisionRepository";

export class GestionVacantesRevisionUseCase {
  private readonly repository: VacanteRevisionRepository;

  constructor(repository: VacanteRevisionRepository) {
    this.repository = repository;
  }

  listar(): Promise<VacanteRevision[]> {
    return this.repository.listar();
  }

  cambiarEstado(idVacante: number, estado: string, observaciones?: string): Promise<void> {
    return this.repository.cambiarEstado(idVacante, estado, observaciones);
  }

  liberarPrepadron(filtros?: LiberarPrepadronFiltros): Promise<void> {
    return this.repository.liberarPrepadron(filtros);
  }
}
