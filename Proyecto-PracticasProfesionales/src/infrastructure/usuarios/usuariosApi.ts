import { apiClient } from "../api/apiClient";

export interface Usuario {
  id_usuario: number;
  id_rol: number;
  nombre: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  correo: string;
  estado: string;
}

export async function obtenerUsuarios(): Promise<Usuario[]> {
  const response = await apiClient.get("/usuarios/");
  return response.data;
}

export interface CrearUsuarioDTO {
  id_rol: number;
  nombre: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  correo: string;
  password: string;
}

export async function crearUsuario(data: CrearUsuarioDTO): Promise<Usuario> {
  const response = await apiClient.post("/usuarios/", data);
  return response.data;
}

export async function cambiarEstadoUsuario(id: number) {
  const response = await apiClient.patch(
    `/usuarios/${id}/estado`
  );

  return response.data;
}

export async function eliminarUsuario(id: number) {
  const response = await apiClient.delete(
    `/usuarios/${id}`
  );

  return response.data;
}