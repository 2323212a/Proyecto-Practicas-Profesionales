import { apiClient } from "../api/apiClient";

export interface LoginRequest {
  correo: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  id_usuario: number;
  id_rol: number;
  rol: string | null;
  nombre: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  nombre_completo: string;
  correo: string;
  perfil_tipo: string | null;
  perfil: Record<string, unknown> | null;
}

export const login = async (
  data: LoginRequest
): Promise<LoginResponse> => {
  const response = await apiClient.post(
    "/auth/login",
    data
  );

  return response.data;
};
