import type { CrearHorasAlumnoRequest, HorasAlumnoResponse } from "./HorasAlumno";

export interface HorasAlumnoRepository {
  listar(idAlumno: number): Promise<HorasAlumnoResponse>;
  crear(idAlumno: number, datos: CrearHorasAlumnoRequest): Promise<void>;
}
