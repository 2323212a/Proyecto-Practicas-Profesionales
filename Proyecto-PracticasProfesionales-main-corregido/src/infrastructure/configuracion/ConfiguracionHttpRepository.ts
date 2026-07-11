import type { ConfiguracionRepository } from "../../domain/configuracion/ConfiguracionRepository";
import type { ConfiguracionSistema } from "../../domain/configuracion/ConfiguracionSistema";
import { apiClient } from "../api/apiClient";

export class ConfiguracionHttpRepository implements ConfiguracionRepository {
  async obtener(): Promise<ConfiguracionSistema> {
    const response = await apiClient.get<ConfiguracionSistema>("/configuracion-sistema/");
    return response.data;
  }

  async guardar(configuracion: ConfiguracionSistema): Promise<ConfiguracionSistema> {
    const response = await apiClient.put<ConfiguracionSistema>(
      "/configuracion-sistema/",
      configuracion
    );
    return response.data;
  }
}
