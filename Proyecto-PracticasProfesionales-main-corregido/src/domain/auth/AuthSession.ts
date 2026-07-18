export interface LoginCredentials {
  correo: string;
  password: string;
}

export interface AuthSession {
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
