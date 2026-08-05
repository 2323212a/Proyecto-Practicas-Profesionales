import type { VacanteRevision } from "./VacanteRevision";

export interface VacanteRevisionRepository {
  listar(): Promise<VacanteRevision[]>;
  cambiarEstado(idVacante: number, estado: string, observaciones?: string): Promise<void>;
  liberarPrepadron(idConvocatoria?: number): Promise<void>;
}
