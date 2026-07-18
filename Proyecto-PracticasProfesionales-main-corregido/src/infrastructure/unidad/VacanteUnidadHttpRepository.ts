import type {
  ConvocatoriaBasica,
  CrearVacanteUnidadInput,
  VacanteUnidad,
  VacantesUnidadResponse,
} from "../../domain/unidad/VacanteUnidad";
import type { VacanteUnidadRepository } from "../../domain/unidad/VacanteUnidadRepository";
import { apiClient } from "../api/apiClient";

export class VacanteUnidadHttpRepository implements VacanteUnidadRepository {
  async listar(_idEmpresa: number): Promise<VacantesUnidadResponse> {
    const { data } = await apiClient.get<VacantesUnidadResponse>("/unidad/me/vacantes");
    return data;
  }

  async crear(_idEmpresa: number, datos: CrearVacanteUnidadInput): Promise<VacanteUnidad> {
    const { data } = await apiClient.post<VacanteUnidad>("/unidad/me/vacantes", datos);
    return data;
  }

  async listarConvocatorias(): Promise<ConvocatoriaBasica[]> {
    const { data } = await apiClient.get<ConvocatoriaBasica[]>("/convocatorias/");
    return data;
  }

  async solicitarParticipacion(idConvocatoria: number): Promise<void> {
    await apiClient.post("/unidad/me/participaciones", { id_convocatoria: idConvocatoria });
  }
}
