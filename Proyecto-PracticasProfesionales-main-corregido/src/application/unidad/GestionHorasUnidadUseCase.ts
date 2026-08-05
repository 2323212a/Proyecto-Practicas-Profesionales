import type { EstadoHoraUnidad, HoraUnidad, HorasUnidadResponse } from "../../domain/unidad/HorasUnidad";
import type { HorasUnidadRepository } from "../../domain/unidad/HorasUnidadRepository";

export class GestionHorasUnidadUseCase {
  private readonly repository: HorasUnidadRepository;

  constructor(repository: HorasUnidadRepository) {
    this.repository = repository;
  }

  listar(idEmpresa: number): Promise<HorasUnidadResponse> {
    return this.repository.listar(idEmpresa);
  }

  cambiarEstado(
    idEmpresa: number,
    idHoras: number,
    estado: Exclude<EstadoHoraUnidad, "Pendiente">,
    observaciones?: string,
  ): Promise<HoraUnidad> {
    return this.repository.cambiarEstado(idEmpresa, idHoras, estado, observaciones);
  }
}
