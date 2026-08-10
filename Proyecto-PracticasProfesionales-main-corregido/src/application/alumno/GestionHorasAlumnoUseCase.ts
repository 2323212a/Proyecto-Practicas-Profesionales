import type { CrearHorasAlumnoRequest, HorasAlumnoResponse } from "../../domain/alumno/HorasAlumno";
import type { HorasAlumnoRepository } from "../../domain/alumno/HorasAlumnoRepository";

export class GestionHorasAlumnoUseCase {
  private readonly repository: HorasAlumnoRepository;

  constructor(repository: HorasAlumnoRepository) {
    this.repository = repository;
  }

  listar(idAlumno: number): Promise<HorasAlumnoResponse> {
    return this.repository.listar(idAlumno);
  }

  crear(idAlumno: number, datos: CrearHorasAlumnoRequest): Promise<void> {
    return this.repository.crear(idAlumno, datos);
  }
}
