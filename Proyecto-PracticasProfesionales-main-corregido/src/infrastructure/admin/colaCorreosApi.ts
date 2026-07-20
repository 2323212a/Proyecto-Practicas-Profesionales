import { apiClient } from "../api/apiClient";

export type EstadoColaCorreo = "PENDIENTE" | "ENVIADO" | "ERROR";

export type ColaCorreoResumen = {
  id: number;
  destinatario: string;
  asunto: string;
  estado: EstadoColaCorreo;
  intentos: number;
  tiene_html: boolean;
  fecha_creacion: string | null;
  fecha_envio: string | null;
  error_ultimo: string | null;
};

export type ColaCorreoDetalle = {
  id: number;
  destinatario: string;
  asunto: string;
  contenido: string;
  contenido_html: string | null;
  estado: EstadoColaCorreo;
  intentos: number;
  fecha_creacion: string | null;
  fecha_envio: string | null;
  error_ultimo: string | null;
};

export async function listarColaCorreos(params?: { estado?: EstadoColaCorreo; limit?: number }) {
  const { data } = await apiClient.get<{ total: number; items: ColaCorreoResumen[] }>("/admin/cola-correos/", {
    params,
  });
  return data;
}

export async function obtenerDetalleColaCorreo(id: number) {
  const { data } = await apiClient.get<ColaCorreoDetalle>(`/admin/cola-correos/${id}`);
  return data;
}

export async function procesarColaCorreos(params?: { max_lote?: number; max_intentos?: number }) {
  const { data } = await apiClient.post<{ mensaje: string; procesados: number }>("/admin/cola-correos/procesar", undefined, {
    params,
  });
  return data;
}

export async function reintentarColaCorreo(id: number) {
  const { data } = await apiClient.post<{ mensaje: string; id: number; estado: EstadoColaCorreo; intentos: number }>(
    `/admin/cola-correos/${id}/reintentar`,
  );
  return data;
}

export async function reintentarColaCorreosMasivo(params?: { estado?: "PENDIENTE" | "ERROR"; limit?: number }) {
  const { data } = await apiClient.post<{
    mensaje: string;
    estado_origen: string;
    total: number;
    ids: number[];
  }>("/admin/cola-correos/reintentar/masivo", undefined, { params });
  return data;
}
