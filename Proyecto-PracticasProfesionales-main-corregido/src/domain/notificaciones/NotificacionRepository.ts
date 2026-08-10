import type { Notificacion, ResumenNotificaciones } from "./Notificacion";

export interface NotificacionRepository {
  listarPorUsuario(idUsuario: number): Promise<Notificacion[]>;
  resumenPorUsuario(idUsuario: number): Promise<ResumenNotificaciones>;
  marcarLeida(idNotificacion: number, leida?: boolean): Promise<Notificacion>;
  marcarTodas(idUsuario: number): Promise<ResumenNotificaciones>;
}
