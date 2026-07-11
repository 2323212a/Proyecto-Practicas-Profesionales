import type {
  CarreraBasica,
  CrearVacanteUnidadInput,
  VacanteUnidad,
  VacantesUnidadResponse,
} from "./VacanteUnidad";

export interface VacanteUnidadRepository {
  listar(idEmpresa: number): Promise<VacantesUnidadResponse>;
  crear(idEmpresa: number, datos: CrearVacanteUnidadInput): Promise<VacanteUnidad>;
  listarCarreras(): Promise<CarreraBasica[]>;
}
