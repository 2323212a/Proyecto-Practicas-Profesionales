import type {
  ConfirmacionAsignacionesResponse,
  CambiarEmpresaAsignacionRequest,
  ConfirmarAsignacionRequest,
  SecretariaAcademicaResponse,
  RechazarSeleccionRequest,
} from "./ConfirmacionAsignacion";

export interface ConfirmacionAsignacionRepository {
  listar(): Promise<ConfirmacionAsignacionesResponse>;
  confirmar(datos: ConfirmarAsignacionRequest): Promise<void>;
  cambiarEmpresa(idAsignacion: number, datos: CambiarEmpresaAsignacionRequest): Promise<void>;
  rechazar(idSeleccion: number, datos: RechazarSeleccionRequest): Promise<void>;
  actualizarSecretariaAcademica(nombre: string): Promise<SecretariaAcademicaResponse>;
}
