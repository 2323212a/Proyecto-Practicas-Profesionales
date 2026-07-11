import type { PadronAlumnoResponse, PreferenciaEmpresaRequest } from "./Padron";

export interface PadronRepository {
  obtener(idAlumno: number): Promise<PadronAlumnoResponse>;
  guardarPreferencias(
    idAlumno: number,
    preferencias: PreferenciaEmpresaRequest[],
    idEmpresaPrioritaria: number | null
  ): Promise<void>;
}
