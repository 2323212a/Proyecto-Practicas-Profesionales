import type {
  BitacoraAuditoriaFiltros,
  BitacoraAuditoriaResponse,
} from "../../domain/admin/BitacoraAuditoria";
import { apiClient } from "../api/apiClient";

export async function obtenerBitacoraAuditoria(filtros: BitacoraAuditoriaFiltros = {}) {
  const { data } = await apiClient.get<BitacoraAuditoriaResponse>("/bitacora-auditoria/", {
    params: filtros,
  });
  return data;
}
