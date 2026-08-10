import type {
  PerfilUnidadResponse,
  UnidadDashboardResponse,
} from "../../domain/unidad/UnidadDashboard";
import { apiClient } from "../api/apiClient";

export async function obtenerDashboardUnidad() {
  const { data } = await apiClient.get<UnidadDashboardResponse>("/unidad/me/dashboard");
  return data;
}

export async function obtenerPerfilUnidad() {
  const { data } = await apiClient.get<PerfilUnidadResponse>("/unidad/me/perfil");
  return data;
}
