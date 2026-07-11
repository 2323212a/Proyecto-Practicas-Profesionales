import type { LiberacionRepository } from "../../domain/coordinador/LiberacionRepository";
import type { AnexarLiberacionPayload } from "../../domain/coordinador/Liberacion";

export class GestionLiberacionUseCase {
  private readonly repository: LiberacionRepository;

  constructor(repository: LiberacionRepository) {
    this.repository = repository;
  }

  listar() {
    return this.repository.listar();
  }

  emitir(idAsignacion: number) {
    return this.repository.emitir(idAsignacion);
  }

  anexarDocumento(idAsignacion: number, payload: AnexarLiberacionPayload) {
    return this.repository.anexarDocumento(idAsignacion, payload);
  }

  obtenerAlumno(idAlumno: number) {
    return this.repository.obtenerAlumno(idAlumno);
  }
}
