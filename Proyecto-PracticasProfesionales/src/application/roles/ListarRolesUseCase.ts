import type { Rol } from "../../domain/rol/Rol";
import type { RolRepository } from "../../domain/rol/RolRepository";

export class ListarRolesUseCase {
  private readonly repository: RolRepository;

  constructor(repository: RolRepository) {
    this.repository = repository;
  }

  execute(): Promise<Rol[]> {
    return this.repository.listar();
  }
}
