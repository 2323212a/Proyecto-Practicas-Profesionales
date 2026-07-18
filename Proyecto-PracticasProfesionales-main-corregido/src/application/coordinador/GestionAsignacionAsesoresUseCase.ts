import type { AsignacionAsesorResponse } from "../../domain/coordinador/AsignacionAsesor";
import type { AsignacionAsesorRepository } from "../../domain/coordinador/AsignacionAsesorRepository";

export class GestionAsignacionAsesoresUseCase {
  private readonly repository: AsignacionAsesorRepository;

  constructor(repository: AsignacionAsesorRepository) {
    this.repository = repository;
  }

  listar(): Promise<AsignacionAsesorResponse> {
    return this.repository.listar();
  }

  asignarAsesor(idAsignacion: number, idAsesor: number): Promise<void> {
    return this.repository.asignarAsesor(idAsignacion, idAsesor);
  }
}

