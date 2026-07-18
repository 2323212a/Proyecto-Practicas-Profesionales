import type {
  PadronAlumnoResponse,
  PreferenciaVacanteRequest,
} from "../../domain/alumno/Padron";
import type { PadronRepository } from "../../domain/alumno/PadronRepository";

export class GestionPadronUseCase {
  private readonly repository: PadronRepository;

  constructor(repository: PadronRepository) {
    this.repository = repository;
  }

  obtener(idAlumno: number): Promise<PadronAlumnoResponse> {
    return this.repository.obtener(idAlumno);
  }

  guardarPreferencias(
    idAlumno: number,
    preferencias: PreferenciaVacanteRequest[],
    idVacantePrioritaria: number | null
  ): Promise<void> {
    return this.repository.guardarPreferencias(
      idAlumno,
      preferencias,
      idVacantePrioritaria
    );
  }
}
