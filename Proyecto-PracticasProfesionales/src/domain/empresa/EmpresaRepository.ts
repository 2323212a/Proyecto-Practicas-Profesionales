import type { CrearEmpresaDTO, Empresa } from "./Empresa";

export interface EmpresaRepository {
  crear(data: CrearEmpresaDTO): Promise<Empresa>;
  listar(): Promise<Empresa[]>;
  obtenerPorId(id_empresa: number): Promise<Empresa>;
  actualizar(id_empresa: number, data: CrearEmpresaDTO): Promise<Empresa>;
}