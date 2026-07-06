import type {
  ResponsableEmpresa,
  CrearResponsableEmpresaDTO,
} from "./ResponsableEmpresa";

export interface ResponsableEmpresaRepository {
  listarPorEmpresa(id_empresa: number): Promise<ResponsableEmpresa[]>;

  crear(
    data: CrearResponsableEmpresaDTO
  ): Promise<ResponsableEmpresa>;
}