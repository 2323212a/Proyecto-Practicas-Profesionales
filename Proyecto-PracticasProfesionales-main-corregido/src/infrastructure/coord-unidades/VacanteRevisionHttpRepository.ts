import type { VacanteRevision } from "../../domain/coord-unidades/VacanteRevision";
import type { VacanteRevisionRepository } from "../../domain/coord-unidades/VacanteRevisionRepository";
import { apiClient } from "../api/apiClient";

export class VacanteRevisionHttpRepository implements VacanteRevisionRepository {
  async listar(): Promise<VacanteRevision[]> {
    const { data } = await apiClient.get<VacanteRevision[]>(
      "/coord-unidades/empresas/vacantes/"
    );
    return data;
  }

  async cambiarEstado(idVacante: number, estado: string, observaciones?: string): Promise<void> {
    await apiClient.patch(`/coord-unidades/empresas/vacantes/${idVacante}/estado`, {
      estado_vacante: estado,
      observaciones,
    });
  }

  async liberarPrepadron(idConvocatoria?: number): Promise<void> {
    await apiClient.post("/coord-unidades/empresas/vacantes/liberar-prepadron", {
      id_convocatoria: idConvocatoria,
    });
  }
}
