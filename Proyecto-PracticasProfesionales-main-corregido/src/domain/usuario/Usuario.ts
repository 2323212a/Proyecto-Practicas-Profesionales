export interface Usuario {
  id_usuario: number;
  id_rol: number;
  nombre: string;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  correo: string;
  estado: string;
}

export interface CrearUsuario {
  id_rol: number;
  nombre: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  correo: string;
  password: string;
}

export interface ActualizarUsuario {
  id_rol: number;
  nombre: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  correo: string;
  estado: string;
}

export interface UsuarioPerfil {
  tipo: string;
  datos: Record<string, unknown> | null;
}

export interface ActualizarUsuarioPerfil {
  id_carrera?: number | null;
  matricula?: string | null;
  semestre?: number | null;
  grupo?: string | null;
  creditos_aprobados?: number | null;
  estado_alumno?: string | null;
  departamento?: string | null;
  area?: string | null;
  id_empresa?: number | null;
  cargo?: string | null;
  telefono?: string | null;
}
