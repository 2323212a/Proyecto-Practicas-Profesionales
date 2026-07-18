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
  debe_cambiar_password?: boolean;
  tipo_perfil?: string;
  id_perfil?: number | null;
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

export async function cambiarPasswordInicial(data: {
  password_actual: string;
  password_nueva: string;
  confirmar_password: string;
}) {
  const response = await apiClient.post("/auth/cambiar-password-inicial", data);
  return response.data;
}
