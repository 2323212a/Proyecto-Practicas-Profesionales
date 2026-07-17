import type { Notificacion, ResumenNotificaciones } from "../../domain/notificaciones/Notificacion";
import type { NotificacionRepository } from "../../domain/notificaciones/NotificacionRepository";
import { apiClient } from "../api/apiClient";

export class NotificacionHttpRepository implements NotificacionRepository {
  async listarPorUsuario(_idUsuario: number): Promise<Notificacion[]> {
    const { data } = await apiClient.get<Notificacion[]>("/notificaciones/me/");
    return data;
  }

  async resumenPorUsuario(_idUsuario: number): Promise<ResumenNotificaciones> {
    const { data } = await apiClient.get<ResumenNotificaciones>("/notificaciones/me/resumen");
    return data;
  }

  async marcarLeida(idNotificacion: number, leida = true): Promise<Notificacion> {
    const { data } = await apiClient.patch<Notificacion>(`/notificaciones/${idNotificacion}`, { leida });
    return data;
  }

  async marcarTodas(_idUsuario: number): Promise<ResumenNotificaciones> {
    const { data } = await apiClient.patch<ResumenNotificaciones>("/notificaciones/me/marcar-todas");
    return data;
  }

  async limpiarBandeja(_idUsuario: number): Promise<void> {
    await apiClient.delete("/notificaciones/me/limpiar");
  }
}
