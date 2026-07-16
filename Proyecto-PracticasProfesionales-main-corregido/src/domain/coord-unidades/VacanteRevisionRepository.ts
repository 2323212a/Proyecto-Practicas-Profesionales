import type { VacanteRevision } from "./VacanteRevision";

export interface LiberarPrepadronFiltros {
  id_convocatoria?: number;
  periodo?: string;
  id_tipo_practica?: number;
}

export interface VacanteRevisionRepository {
  listar(): Promise<VacanteRevision[]>;
  cambiarEstado(idVacante: number, estado: string, observaciones?: string): Promise<void>;
  liberarPrepadron(filtros?: LiberarPrepadronFiltros): Promise<void>;
}
