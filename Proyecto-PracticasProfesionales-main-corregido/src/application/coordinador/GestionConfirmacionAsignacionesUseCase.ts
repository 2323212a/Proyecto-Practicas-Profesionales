import type {
  ConfirmacionAsignacionesResponse,
  CambiarEmpresaAsignacionRequest,
  ConfirmarAsignacionRequest,
  SecretariaAcademicaResponse,
  RechazarSeleccionRequest,
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

  cambiarEmpresa(idAsignacion: number, datos: CambiarEmpresaAsignacionRequest): Promise<void> {
    return this.repository.cambiarEmpresa(idAsignacion, datos);
  }

  rechazar(idSeleccion: number, datos: RechazarSeleccionRequest): Promise<void> {
    return this.repository.rechazar(idSeleccion, datos);
  }

  actualizarSecretariaAcademica(nombre: string): Promise<SecretariaAcademicaResponse> {
    return this.repository.actualizarSecretariaAcademica(nombre);
  }
}
