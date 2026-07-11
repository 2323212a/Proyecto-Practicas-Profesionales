import type { EmpresaRevision } from "./EmpresaRevision";

export interface EmpresaRevisionRepository {
  listar(): Promise<EmpresaRevision[]>;
  cambiarEstado(idEmpresa: number, estado: string): Promise<void>;
}
