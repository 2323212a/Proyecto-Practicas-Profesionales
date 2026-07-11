import type { Rol } from "./Rol";

export interface RolRepository {
  listar(): Promise<Rol[]>;
}
