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
  nombre: string;
  correo: string;
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