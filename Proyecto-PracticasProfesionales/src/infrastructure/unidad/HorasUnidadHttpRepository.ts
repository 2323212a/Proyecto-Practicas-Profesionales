import type { EstadoHoraUnidad, HoraUnidad, HorasUnidadResponse } from "../../domain/unidad/HorasUnidad";
import type { HorasUnidadRepository } from "../../domain/unidad/HorasUnidadRepository";
import { apiClient } from "../api/apiClient";

export class HorasUnidadHttpRepository implements HorasUnidadRepository {
  async listar(idEmpresa: number): Promise<HorasUnidadResponse> {
    const { data } = await apiClient.get<HorasUnidadResponse>("/unidad/me/horas");
    return data;
  }

  async cambiarEstado(
    idEmpresa: number,
    idHoras: number,
    estado: Exclude<EstadoHoraUnidad, "Pendiente">,
    observaciones?: string,
  ): Promise<HoraUnidad> {
    const { data } = await apiClient.patch<HoraUnidad>(
      `/unidad/me/horas/${idHoras}/estado`,
      { estado, observaciones },
    );
    return data;
  }
}
