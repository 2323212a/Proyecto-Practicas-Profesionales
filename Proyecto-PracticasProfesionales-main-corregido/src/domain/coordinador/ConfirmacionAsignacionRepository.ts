import type {
  ConfirmacionAsignacionesResponse,
  ConfirmarAsignacionRequest,
  RechazarSeleccionRequest,
} from "./ConfirmacionAsignacion";

export interface ConfirmacionAsignacionRepository {
  listar(): Promise<ConfirmacionAsignacionesResponse>;
  confirmar(datos: ConfirmarAsignacionRequest): Promise<void>;
  rechazar(idSeleccion: number, datos: RechazarSeleccionRequest): Promise<void>;
}
