import { apiClient } from "../api/apiClient";

export async function obtenerRoles() {
  const response = await apiClient.get("/roles/");
  return response.data;
}