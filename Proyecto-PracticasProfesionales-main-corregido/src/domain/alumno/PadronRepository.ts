import type { PadronAlumnoResponse, PreferenciaVacanteRequest } from "./Padron";

export interface PadronRepository {
  obtener(idAlumno: number): Promise<PadronAlumnoResponse>;
  guardarPreferencias(
    idAlumno: number,
    preferencias: PreferenciaVacanteRequest[],
    idVacantePrioritaria: number | null
  ): Promise<void>;
}
