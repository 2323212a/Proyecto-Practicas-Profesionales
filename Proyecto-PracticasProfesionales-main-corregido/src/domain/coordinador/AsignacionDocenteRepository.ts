import type { AsignacionDocenteResponse } from "./AsignacionDocente";

export interface AsignacionDocenteRepository {
  listar(): Promise<AsignacionDocenteResponse>;
  asignarDocente(idAsignacion: number, idDocente: number): Promise<void>;
}
