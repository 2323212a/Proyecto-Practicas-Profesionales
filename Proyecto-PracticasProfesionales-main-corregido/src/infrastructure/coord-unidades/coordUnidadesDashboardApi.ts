import type { CoordUnidadesDashboardResponse } from "../../domain/coord-unidades/CoordUnidadesDashboard";
import { apiClient } from "../api/apiClient";

export async function obtenerDashboardCoordUnidades() {
  const { data } = await apiClient.get<CoordUnidadesDashboardResponse>(
    "/coord-unidades/empresas/dashboard"
  );
  return data;
}
