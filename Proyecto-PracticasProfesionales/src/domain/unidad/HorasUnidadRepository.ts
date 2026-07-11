import type { EstadoHoraUnidad, HoraUnidad, HorasUnidadResponse } from "./HorasUnidad";

export interface HorasUnidadRepository {
  listar(idEmpresa: number): Promise<HorasUnidadResponse>;
  cambiarEstado(
    idEmpresa: number,
    idHoras: number,
    estado: Exclude<EstadoHoraUnidad, "Pendiente">,
    observaciones?: string,
  ): Promise<HoraUnidad>;
}
