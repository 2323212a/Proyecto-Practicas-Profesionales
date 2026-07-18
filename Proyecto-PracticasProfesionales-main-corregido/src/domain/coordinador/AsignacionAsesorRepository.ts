import type { AsignacionAsesorResponse } from "./AsignacionAsesor";

export interface AsignacionAsesorRepository {
  listar(): Promise<AsignacionAsesorResponse>;
  asignarAsesor(idAsignacion: number, idAsesor: number): Promise<void>;
}

