import type { DireccionFiltros, DireccionIndicadoresResponse } from "../../domain/direccion/DireccionIndicadores";
import { apiClient } from "../api/apiClient";

export async function obtenerIndicadoresDireccion(filtros: DireccionFiltros = {}) {
  const { data } = await apiClient.get<DireccionIndicadoresResponse>("/direccion/indicadores", {
    params: filtros,
  });
  return data;
}

export async function descargarDireccionPdf(filtros: DireccionFiltros = {}) {
  const { data, headers } = await apiClient.get<Blob>("/direccion/reportes/exportar", {
    params: { ...filtros, formato: "pdf" },
    responseType: "blob",
  });

  const contentType = headers["content-type"] ?? "";
  if (!contentType.includes("application/pdf")) {
    throw new Error("La respuesta de Direccion no es un PDF valido.");
  }

  const url = window.URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = "reporte_direccion.pdf";
  link.click();
  window.URL.revokeObjectURL(url);
}
