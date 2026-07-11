import type {
  ActualizarUsuario,
  ActualizarUsuarioPerfil,
  CrearUsuario,
  Usuario,
  UsuarioPerfil,
} from "../../domain/usuario/Usuario";
import type { UsuarioRepository } from "../../domain/usuario/UsuarioRepository";
import { apiClient } from "../api/apiClient";

export class UsuarioHttpRepository implements UsuarioRepository {
  async listar(): Promise<Usuario[]> {
    const response = await apiClient.get<Usuario[]>("/usuarios/");
    return response.data;
  }

  async crear(data: CrearUsuario): Promise<Usuario> {
    const response = await apiClient.post<Usuario>("/usuarios/", data);
    return response.data;
  }

  async actualizar(id: number, data: ActualizarUsuario): Promise<Usuario> {
    const response = await apiClient.put<Usuario>(`/usuarios/${id}`, data);
    return response.data;
  }

  async obtenerPerfil(id: number): Promise<UsuarioPerfil> {
    const response = await apiClient.get<UsuarioPerfil>(`/usuarios/${id}/perfil`);
    return response.data;
  }

  async actualizarPerfil(id: number, data: ActualizarUsuarioPerfil): Promise<UsuarioPerfil> {
    const response = await apiClient.put<UsuarioPerfil>(`/usuarios/${id}/perfil`, data);
    return response.data;
  }

  async cambiarEstado(id: number): Promise<Usuario> {
    const response = await apiClient.patch<Usuario>(`/usuarios/${id}/estado`);
    return response.data;
  }

  async eliminar(id: number): Promise<void> {
    await apiClient.delete(`/usuarios/${id}`);
  }
}
