import type { EmpresaRevision } from "../../domain/coord-unidades/EmpresaRevision";
import type { EmpresaRevisionRepository } from "../../domain/coord-unidades/EmpresaRevisionRepository";

export class GestionEmpresasRevisionUseCase {
  private readonly repository: EmpresaRevisionRepository;

  constructor(repository: EmpresaRevisionRepository) {
    this.repository = repository;
  }

  listar(): Promise<EmpresaRevision[]> {
    return this.repository.listar();
  }

  cambiarEstado(idEmpresa: number, estado: string): Promise<void> {
    return this.repository.cambiarEstado(idEmpresa, estado);
  }
}
