import type {
  AlumnoGestionCoordinador,
  CoordinadorDashboardResponse,
} from "../../domain/coordinador/CoordinadorGestion";
import { apiClient } from "../api/apiClient";

export async function obtenerDashboardCoordinador() {
  const { data } = await apiClient.get<CoordinadorDashboardResponse>(
    "/coordinador/documentos/dashboard"
  );
  return data;
}

export async function listarAlumnosGestionCoordinador() {
  const { data } = await apiClient.get<AlumnoGestionCoordinador[]>(
    "/coordinador/documentos/alumnos"
  );
  return data;
}
