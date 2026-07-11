import type { Rol } from "../../domain/rol/Rol";
import type { RolRepository } from "../../domain/rol/RolRepository";
import { apiClient } from "../api/apiClient";

export class RolHttpRepository implements RolRepository {
  async listar(): Promise<Rol[]> {
    const response = await apiClient.get<Rol[]>("/roles/");
    return response.data;
  }
}
