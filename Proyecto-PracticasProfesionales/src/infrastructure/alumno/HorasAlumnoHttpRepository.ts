import type { CrearHorasAlumnoRequest, HorasAlumnoResponse } from "../../domain/alumno/HorasAlumno";
import type { HorasAlumnoRepository } from "../../domain/alumno/HorasAlumnoRepository";
import { apiClient } from "../api/apiClient";

export class HorasAlumnoHttpRepository implements HorasAlumnoRepository {
  async listar(idAlumno: number): Promise<HorasAlumnoResponse> {
    const { data } = await apiClient.get<HorasAlumnoResponse>("/alumno/horas/me/");
    return data;
  }

  async crear(idAlumno: number, datos: CrearHorasAlumnoRequest): Promise<void> {
    await apiClient.post("/alumno/horas/me/", datos);
  }
}
