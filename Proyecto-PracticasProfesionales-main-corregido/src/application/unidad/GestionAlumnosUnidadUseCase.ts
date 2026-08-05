import type { AlumnosUnidadResponse } from "../../domain/unidad/AlumnoUnidad";
import type { AlumnoUnidadRepository } from "../../domain/unidad/AlumnoUnidadRepository";

export class GestionAlumnosUnidadUseCase {
  private readonly repository: AlumnoUnidadRepository;

  constructor(repository: AlumnoUnidadRepository) {
    this.repository = repository;
  }

  listar(idEmpresa: number): Promise<AlumnosUnidadResponse> {
    return this.repository.listar(idEmpresa);
  }
}
