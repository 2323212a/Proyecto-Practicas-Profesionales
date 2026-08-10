export interface BitacoraAuditoriaItem {
  id_bitacora: number;
  id_usuario: number | null;
  usuario_correo: string | null;
  accion: string;
  modulo: string;
  fecha: string | null;
  descripcion: string | null;
  entidad: string | null;
  id_entidad: number | null;
  ip: string | null;
  user_agent: string | null;
}

export interface BitacoraAuditoriaFiltros {
  fecha_inicio?: string;
  fecha_fin?: string;
  modulo?: string;
  accion?: string;
  entidad?: string;
  usuario?: string;
  pagina?: number;
  limite?: number;
}

export interface BitacoraAuditoriaResponse {
  items: BitacoraAuditoriaItem[];
  total: number;
  pagina: number;
  limite: number;
  total_paginas: number;
  modulos: string[];
  acciones: string[];
  entidades: string[];
}
