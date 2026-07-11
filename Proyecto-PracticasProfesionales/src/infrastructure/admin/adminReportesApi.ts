import type { AdminReportesResponse } from "../../domain/admin/AdminReportes";
import { apiClient } from "../api/apiClient";

export async function obtenerReportesAdmin(periodo = "todos", modulo = "todos") {
  const { data } = await apiClient.get<AdminReportesResponse>("/admin/reportes/", {
    params: { periodo, modulo },
  });
  return data;
}

export async function descargarReportesAdmin(periodo = "todos", modulo = "todos") {
  const { data } = await apiClient.get<Blob>("/admin/reportes/exportar", {
    params: { periodo, modulo },
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `reportes_admin_${periodo}_${modulo}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}
