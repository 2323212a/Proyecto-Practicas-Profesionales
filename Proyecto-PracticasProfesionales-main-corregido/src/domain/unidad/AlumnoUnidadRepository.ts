import type { AlumnosUnidadResponse } from "./AlumnoUnidad";

export interface AlumnoUnidadRepository {
  listar(idEmpresa: number): Promise<AlumnosUnidadResponse>;
}
