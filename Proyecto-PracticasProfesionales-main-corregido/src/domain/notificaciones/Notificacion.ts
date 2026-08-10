export interface Notificacion {
  id_notificacion: number;
  id_usuario: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  fecha_envio: string;
  fecha_creacion?: string;
  tipo?: string;
  categoria?: string;
  prioridad?: string;
  modulo?: string | null;
  entidad?: string | null;
  id_entidad?: number | null;
  url_destino?: string | null;
}


export interface ResumenNotificaciones {
  total: number;
  no_leidas: number;
  leidas: number;
}
