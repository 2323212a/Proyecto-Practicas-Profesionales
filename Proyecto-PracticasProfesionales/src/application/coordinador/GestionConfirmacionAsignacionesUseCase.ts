import type {
  ConfirmacionAsignacionesResponse,
  ConfirmarAsignacionRequest,
} from "../../domain/coordinador/ConfirmacionAsignacion";
import type { ConfirmacionAsignacionRepository } from "../../domain/coordinador/ConfirmacionAsignacionRepository";

export class GestionConfirmacionAsignacionesUseCase {
  private readonly repository: ConfirmacionAsignacionRepository;

  constructor(repository: ConfirmacionAsignacionRepository) {
    this.repository = repository;
  }

  listar(): Promise<ConfirmacionAsignacionesResponse> {
    return this.repository.listar();
  }

  confirmar(datos: ConfirmarAsignacionRequest): Promise<void> {
    return this.repository.confirmar(datos);
  }
}
