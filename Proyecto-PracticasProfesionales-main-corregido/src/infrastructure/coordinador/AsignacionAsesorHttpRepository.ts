import type { AsignacionAsesorResponse } from "../../domain/coordinador/AsignacionAsesor";
import type { AsignacionAsesorRepository } from "../../domain/coordinador/AsignacionAsesorRepository";
import { apiClient } from "../api/apiClient";

export class AsignacionAsesorHttpRepository implements AsignacionAsesorRepository {
  async listar(): Promise<AsignacionAsesorResponse> {
    const response = await apiClient.get<AsignacionAsesorResponse>(
      "/coordinador/asignacion-asesores/"
    );
    return response.data;
  }

  async asignarAsesor(idAsignacion: number, idAsesor: number): Promise<void> {
    await apiClient.patch(`/asignaciones/${idAsignacion}/asesor`, {
      id_asesor: idAsesor,
    });
  }
}

