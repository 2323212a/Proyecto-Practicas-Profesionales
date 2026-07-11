import type { ConfiguracionSistema } from "./ConfiguracionSistema";

export interface ConfiguracionRepository {
  obtener(): Promise<ConfiguracionSistema>;
  guardar(configuracion: ConfiguracionSistema): Promise<ConfiguracionSistema>;
}
