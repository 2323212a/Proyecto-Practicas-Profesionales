import type { AlumnosUnidadResponse } from "../../domain/unidad/AlumnoUnidad";
import type { AlumnoUnidadRepository } from "../../domain/unidad/AlumnoUnidadRepository";
import { apiClient } from "../api/apiClient";

export class AlumnoUnidadHttpRepository implements AlumnoUnidadRepository {
  async listar(_idEmpresa: number): Promise<AlumnosUnidadResponse> {
    const { data } = await apiClient.get<AlumnosUnidadResponse>(
      "/unidad/me/alumnos"
    );
    return data;
  }
}
