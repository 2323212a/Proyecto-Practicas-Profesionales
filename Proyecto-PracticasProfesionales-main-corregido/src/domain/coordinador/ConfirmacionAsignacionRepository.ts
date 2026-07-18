import type {
  ConfirmacionAsignacionesResponse,
  ConfirmarAsignacionRequest,
  SecretariaAcademicaResponse,
  RechazarSeleccionRequest,
} from "./ConfirmacionAsignacion";

export interface ConfirmacionAsignacionRepository {
  listar(): Promise<ConfirmacionAsignacionesResponse>;
  confirmar(datos: ConfirmarAsignacionRequest): Promise<void>;
  rechazar(idSeleccion: number, datos: RechazarSeleccionRequest): Promise<void>;
  actualizarSecretariaAcademica(nombre: string): Promise<SecretariaAcademicaResponse>;
}
