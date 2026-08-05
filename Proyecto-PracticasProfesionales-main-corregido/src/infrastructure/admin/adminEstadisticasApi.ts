import { apiClient } from "../api/apiClient";

export async function obtenerEstadisticasAdmin() {
  const response = await apiClient.get("/admin/estadisticas/");
  return response.data;
}