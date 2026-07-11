import type { EmpresaRevision } from "../../domain/coord-unidades/EmpresaRevision";
import type { EmpresaRevisionRepository } from "../../domain/coord-unidades/EmpresaRevisionRepository";
import { apiClient } from "../api/apiClient";

export class EmpresaRevisionHttpRepository implements EmpresaRevisionRepository {
  async listar(): Promise<EmpresaRevision[]> {
    const response = await apiClient.get<EmpresaRevision[]>("/coord-unidades/empresas/");
    return response.data;
  }

  async cambiarEstado(idEmpresa: number, estado: string): Promise<void> {
    await apiClient.patch(`/coord-unidades/empresas/${idEmpresa}/estado`, {
      estado_empresa: estado,
    });
  }
}
