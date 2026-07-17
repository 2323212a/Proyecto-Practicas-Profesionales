import type {
  ConfirmacionAsignacionesResponse,
  ConfirmarAsignacionRequest,
  RechazarSeleccionRequest,
  SecretariaAcademicaResponse,
} from "./ConfirmacionAsignacion";

export interface ConfirmacionAsignacionRepository {
  listar(): Promise<ConfirmacionAsignacionesResponse>;
  actualizarSecretariaAcademica(nombre: string): Promise<SecretariaAcademicaResponse>;
  confirmar(datos: ConfirmarAsignacionRequest): Promise<void>;
  rechazar(idSeleccion: number, datos: RechazarSeleccionRequest): Promise<void>;
}
