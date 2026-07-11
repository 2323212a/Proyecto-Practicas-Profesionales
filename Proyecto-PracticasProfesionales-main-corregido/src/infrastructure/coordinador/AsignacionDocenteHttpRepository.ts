import type { AsignacionDocenteResponse } from "../../domain/coordinador/AsignacionDocente";
import type { AsignacionDocenteRepository } from "../../domain/coordinador/AsignacionDocenteRepository";
import { apiClient } from "../api/apiClient";

export class AsignacionDocenteHttpRepository implements AsignacionDocenteRepository {
  async listar(): Promise<AsignacionDocenteResponse> {
    const response = await apiClient.get<AsignacionDocenteResponse>(
      "/coordinador/asignacion-docentes/"
    );
    return response.data;
  }

  async asignarDocente(idAsignacion: number, idDocente: number): Promise<void> {
    await apiClient.patch(`/asignaciones/${idAsignacion}/docente`, {
      id_docente: idDocente,
    });
  }
}
