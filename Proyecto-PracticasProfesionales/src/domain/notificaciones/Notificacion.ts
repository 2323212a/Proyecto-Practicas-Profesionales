export interface Notificacion {
  id_notificacion: number;
  id_usuario: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha_envio: string;
}

export interface ResumenNotificaciones {
  total: number;
  no_leidas: number;
  leidas: number;
}
