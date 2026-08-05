import type { ConfiguracionRepository } from "../../domain/configuracion/ConfiguracionRepository";
import type { ConfiguracionSistema } from "../../domain/configuracion/ConfiguracionSistema";

export class GestionConfiguracionUseCase {
  private readonly repository: ConfiguracionRepository;

  constructor(repository: ConfiguracionRepository) {
    this.repository = repository;
  }

  obtener(): Promise<ConfiguracionSistema> {
    return this.repository.obtener();
  }

  guardar(configuracion: ConfiguracionSistema): Promise<ConfiguracionSistema> {
    return this.repository.guardar(configuracion);
  }
}
