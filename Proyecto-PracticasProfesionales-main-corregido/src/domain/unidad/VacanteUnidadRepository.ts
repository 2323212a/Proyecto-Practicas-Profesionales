import type {
  ActualizarVacanteUnidadInput,
  CarreraBasica,
  CrearVacanteUnidadInput,
  VacanteUnidad,
  VacantesUnidadResponse,
} from "./VacanteUnidad";

export interface VacanteUnidadRepository {
  listar(idEmpresa: number): Promise<VacantesUnidadResponse>;
  crear(idEmpresa: number, datos: CrearVacanteUnidadInput): Promise<VacanteUnidad>;
  actualizar(idEmpresa: number, idVacante: number, datos: ActualizarVacanteUnidadInput): Promise<VacanteUnidad>;
  listarCarreras(): Promise<CarreraBasica[]>;
}
