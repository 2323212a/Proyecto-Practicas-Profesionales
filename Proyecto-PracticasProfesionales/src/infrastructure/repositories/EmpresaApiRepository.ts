import type { CrearEmpresaDTO, Empresa } from "../../domain/empresa/Empresa";
import type { EmpresaRepository } from "../../domain/empresa/EmpresaRepository";

const API_URL = "http://127.0.0.1:8000";

export class EmpresaApiRepository implements EmpresaRepository {
  async crear(data: CrearEmpresaDTO): Promise<Empresa> {
    const response = await fetch(`${API_URL}/empresas/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Error al crear empresa");
    }

    return response.json();
  }

  async listar(): Promise<Empresa[]> {
    const response = await fetch(`${API_URL}/empresas/`);

    if (!response.ok) {
      throw new Error("Error al listar empresas");
    }

    return response.json();
  }

  async obtenerPorId(id_empresa: number): Promise<Empresa> {
    const response = await fetch(`${API_URL}/empresas/${id_empresa}`);

    if (!response.ok) {
      throw new Error("Error al obtener empresa");
    }

    return response.json();
  }

  async actualizar(
    id_empresa: number,
    data: CrearEmpresaDTO
  ): Promise<Empresa> {
    const response = await fetch(`${API_URL}/empresas/${id_empresa}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Error al actualizar empresa");
    }

    return response.json();
  }
}