import type { Notificacion, ResumenNotificaciones } from "../../domain/notificaciones/Notificacion";
import type { NotificacionRepository } from "../../domain/notificaciones/NotificacionRepository";
import { apiClient } from "../api/apiClient";

type NotificacionApi = Notificacion & {
  fecha_creacion?: string;
  fecha_envio?: string;
};

function normalizarNotificacion(notificacion: NotificacionApi): Notificacion {
  return {
    ...notificacion,
    fecha_envio: notificacion.fecha_envio ?? notificacion.fecha_creacion ?? new Date().toISOString(),
  };
}

export class NotificacionHttpRepository implements NotificacionRepository {
  async listarPorUsuario(_idUsuario: number): Promise<Notificacion[]> {
    const { data } = await apiClient.get<NotificacionApi[]>("/notificaciones/me/");
    return data.map(normalizarNotificacion);
  }

  async resumenPorUsuario(_idUsuario: number): Promise<ResumenNotificaciones> {
    const { data } = await apiClient.get<ResumenNotificaciones>("/notificaciones/me/resumen");
    return data;
  }

  async marcarLeida(idNotificacion: number, leida = true): Promise<Notificacion> {
    const { data } = await apiClient.patch<NotificacionApi>(`/notificaciones/${idNotificacion}`, { leida });
    return normalizarNotificacion(data);
  }

  async marcarTodas(_idUsuario: number): Promise<ResumenNotificaciones> {
    const { data } = await apiClient.patch<ResumenNotificaciones>("/notificaciones/me/marcar-todas");
    return data;
  }
}
