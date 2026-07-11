import type { DireccionIndicadoresResponse } from "../../domain/direccion/DireccionIndicadores";
import { apiClient } from "../api/apiClient";

export async function obtenerIndicadoresDireccion() {
  const { data } = await apiClient.get<DireccionIndicadoresResponse>("/direccion/indicadores");
  return data;
}

export async function descargarDireccionCsv(tipo = "brutos") {
  const { data } = await apiClient.get<Blob>("/direccion/exportar", {
    params: { tipo },
    responseType: "blob",
  });

  const url = window.URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = `direccion_${tipo}.csv`;
  link.click();
  window.URL.revokeObjectURL(url);
}
