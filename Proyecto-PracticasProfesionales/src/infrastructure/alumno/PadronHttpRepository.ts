import type { PadronAlumnoResponse, SeleccionEmpresaAlumno } from "../../domain/alumno/Padron";
import type { PadronRepository } from "../../domain/alumno/PadronRepository";
import { apiClient } from "../api/apiClient";

export class PadronHttpRepository implements PadronRepository {
  async obtener(idAlumno: number): Promise<PadronAlumnoResponse> {
    const response = await apiClient.get<PadronAlumnoResponse>(
      "/alumno/padron/me/"
    );
    return response.data;
  }

  async guardarPreferencias(
    idAlumno: number,
    preferencias: SeleccionEmpresaAlumno[],
    idEmpresaPrioritaria: number | null
  ): Promise<void> {
    await apiClient.put("/alumno/padron/me/preferencias", {
      preferencias: preferencias.map((preferencia) => ({
        id_empresa: preferencia.id_empresa,
        prioridad: preferencia.prioridad,
      })),
      id_empresa_prioritaria: idEmpresaPrioritaria,
    });
  }
}
