import type {
  ConfirmacionAsignacionesResponse,
  ConfirmarAsignacionRequest,
} from "../../domain/coordinador/ConfirmacionAsignacion";
import type { ConfirmacionAsignacionRepository } from "../../domain/coordinador/ConfirmacionAsignacionRepository";
import { apiClient } from "../api/apiClient";

export class ConfirmacionAsignacionHttpRepository
  implements ConfirmacionAsignacionRepository
{
  async listar(): Promise<ConfirmacionAsignacionesResponse> {
    const { data } = await apiClient.get<ConfirmacionAsignacionesResponse>(
      "/coordinador/confirmar-asignaciones/"
    );
    return data;
  }

  async confirmar(datos: ConfirmarAsignacionRequest): Promise<void> {
    await apiClient.post("/coordinador/confirmar-asignaciones/", datos);
  }
}
