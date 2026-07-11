import type {
  ConfirmacionAsignacionesResponse,
  ConfirmarAsignacionRequest,
} from "./ConfirmacionAsignacion";

export interface ConfirmacionAsignacionRepository {
  listar(): Promise<ConfirmacionAsignacionesResponse>;
  confirmar(datos: ConfirmarAsignacionRequest): Promise<void>;
}
