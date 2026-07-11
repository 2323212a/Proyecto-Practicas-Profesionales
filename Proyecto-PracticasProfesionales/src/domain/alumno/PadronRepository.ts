import type { PadronAlumnoResponse, SeleccionEmpresaAlumno } from "./Padron";

export interface PadronRepository {
  obtener(idAlumno: number): Promise<PadronAlumnoResponse>;
  guardarPreferencias(
    idAlumno: number,
    preferencias: SeleccionEmpresaAlumno[],
    idEmpresaPrioritaria: number | null
  ): Promise<void>;
}
