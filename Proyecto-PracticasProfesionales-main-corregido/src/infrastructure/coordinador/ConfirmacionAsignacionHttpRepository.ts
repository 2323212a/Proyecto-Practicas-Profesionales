import type {
  ConfirmacionAsignacionesResponse,
  CambiarEmpresaAsignacionRequest,
  ConfirmarAsignacionRequest,
  SecretariaAcademicaResponse,
  RechazarSeleccionRequest,
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

  async cambiarEmpresa(
    idAsignacion: number,
    datos: CambiarEmpresaAsignacionRequest
  ): Promise<void> {
    await apiClient.post(
      `/coordinador/confirmar-asignaciones/${idAsignacion}/cambiar-empresa`,
      datos
    );
  }

  async rechazar(
    idSeleccion: number,
    datos: RechazarSeleccionRequest
  ): Promise<void> {
    await apiClient.patch(
      `/coordinador/confirmar-asignaciones/${idSeleccion}/rechazar`,
      datos
    );
  }

  async actualizarSecretariaAcademica(nombre: string): Promise<SecretariaAcademicaResponse> {
    const { data } = await apiClient.put<SecretariaAcademicaResponse>(
      "/coordinador/confirmar-asignaciones/secretaria-academica",
      { nombre }
    );
    return data;
  }
}
