import type { VacanteRevision } from "./VacanteRevision";

export interface VacanteRevisionRepository {
  listar(): Promise<VacanteRevision[]>;
  cambiarEstado(idVacante: number, estado: string): Promise<void>;
}
