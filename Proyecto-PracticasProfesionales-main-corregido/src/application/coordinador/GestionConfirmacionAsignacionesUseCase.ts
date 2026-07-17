import type {
  ConfirmacionAsignacionesResponse,
  ConfirmarAsignacionRequest,
  RechazarSeleccionRequest,
  SecretariaAcademicaResponse,
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

  actualizarSecretariaAcademica(nombre: string): Promise<SecretariaAcademicaResponse> {
    return this.repository.actualizarSecretariaAcademica(nombre);
  }

  confirmar(datos: ConfirmarAsignacionRequest): Promise<void> {
    return this.repository.confirmar(datos);
  }

  rechazar(idSeleccion: number, datos: RechazarSeleccionRequest): Promise<void> {
    return this.repository.rechazar(idSeleccion, datos);
  }
}
