import type { AsignacionDocenteResponse } from "../../domain/coordinador/AsignacionDocente";
import type { AsignacionDocenteRepository } from "../../domain/coordinador/AsignacionDocenteRepository";

export class GestionAsignacionDocentesUseCase {
  private readonly repository: AsignacionDocenteRepository;

  constructor(repository: AsignacionDocenteRepository) {
    this.repository = repository;
  }

  listar(): Promise<AsignacionDocenteResponse> {
    return this.repository.listar();
  }

  asignarDocente(idAsignacion: number, idDocente: number): Promise<void> {
    return this.repository.asignarDocente(idAsignacion, idDocente);
  }
}
