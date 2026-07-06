import type {
  ResponsableEmpresa,
  CrearResponsableEmpresaDTO,
} from "../../domain/empresa/ResponsableEmpresa";

import type { ResponsableEmpresaRepository } from "../../domain/empresa/ResponsableEmpresaRepository";

const API_URL = "http://127.0.0.1:8000";

export class ResponsableEmpresaApiRepository
  implements ResponsableEmpresaRepository
{
  async listarPorEmpresa(id_empresa: number): Promise<ResponsableEmpresa[]> {
    const response = await fetch(
      `${API_URL}/responsables-empresa/empresa/${id_empresa}`
    );

    if (!response.ok) {
      throw new Error("Error al listar responsables");
    }

    return response.json();
  }

  async crear(
    data: CrearResponsableEmpresaDTO
  ): Promise<ResponsableEmpresa> {
    const response = await fetch(`${API_URL}/responsables-empresa/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("Error al crear responsable");
    }

    return response.json();
  }
}