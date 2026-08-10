import type {
  PadronAlumnoResponse,
  PreferenciaVacanteRequest,
} from "../../domain/alumno/Padron";
import type { PadronRepository } from "../../domain/alumno/PadronRepository";
import { apiClient } from "../api/apiClient";

export class PadronHttpRepository implements PadronRepository {
  async obtener(_idAlumno: number): Promise<PadronAlumnoResponse> {
    const response = await apiClient.get<PadronAlumnoResponse>(
      "/alumno/padron/me/"
    );
    return response.data;
  }

  async guardarPreferencias(
    _idAlumno: number,
    preferencias: PreferenciaVacanteRequest[],
    idVacantePrioritaria: number | null
  ): Promise<void> {
    await apiClient.put("/alumno/padron/me/preferencias", {
      preferencias,
      id_vacante_prioritaria: idVacantePrioritaria,
    });
  }
}
