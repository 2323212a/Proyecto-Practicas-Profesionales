import type {
  CarreraBasica,
  CrearVacanteUnidadInput,
  VacanteUnidad,
  VacantesUnidadResponse,
  ActualizarVacanteUnidadInput,
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

  async actualizar(
    _idEmpresa: number,
    idVacante: number,
    datos: ActualizarVacanteUnidadInput,
  ): Promise<VacanteUnidad> {
    const response = await apiClient.put<VacanteUnidad>(`/unidad/me/vacantes/${idVacante}`, datos);
    return response.data;
  }

  async listarCarreras(): Promise<CarreraBasica[]> {
    const { data } = await apiClient.get<CarreraBasica[]>("/carreras/");
    return data;
  }
}
