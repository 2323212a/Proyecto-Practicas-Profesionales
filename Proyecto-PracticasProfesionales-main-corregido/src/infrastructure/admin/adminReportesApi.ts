import type { AdminReportesFiltros, AdminReportesResponse } from "../../domain/admin/AdminReportes";
import { apiClient } from "../api/apiClient";

export async function obtenerReportesAdmin(filtros: AdminReportesFiltros = {}) {
  const { data } = await apiClient.get<AdminReportesResponse>("/admin/reportes/", {
    params: filtros,
  });
  return data;
}

export async function descargarReporteAdminPdf(filtros: AdminReportesFiltros = {}) {
  const { data } = await apiClient.get<Blob>("/admin/reportes/exportar", {
    params: { ...filtros, formato: "pdf" },
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = "reporte_administrativo.pdf";
  link.click();
  window.URL.revokeObjectURL(url);
}
