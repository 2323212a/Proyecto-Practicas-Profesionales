export interface Usuario {
  id_usuario: number;
  id_rol: number;
  rol?: string | null;
  nombre?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  correo: string;
  estado: string;
  tipo_perfil?: string;
  id_perfil?: number | null;
  puede_eliminar_definitivamente?: boolean;
  relaciones?: string[];
}

export interface CrearUsuario {
  id_rol: number;
  nombre: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  correo: string;
  password: string;
  id_carrera?: number | null;
  id_tipo_practica?: number | null;
  matricula?: string | null;
  semestre?: number | null;
  grupo?: string | null;
  creditos_aprobados?: number | null;
  periodo_practica?: string | null;
  departamento?: string | null;
  cargo?: string | null;
  telefono?: string | null;
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
  usuario: {
    id_usuario: number;
    correo: string;
    estado: string;
    rol: string | null;
    tipo: string;
    nombre: string;
    apellido_paterno?: string | null;
    apellido_materno?: string | null;
  } | null;
  perfil?: Record<string, unknown> | null;
  datos: Record<string, unknown> | null;
}

export interface ActualizarUsuarioPerfil {
  nombre?: string | null;
  apellido_paterno?: string | null;
  apellido_materno?: string | null;
  correo?: string | null;
  id_carrera?: number | null;
  id_tipo_practica?: number | null;
  matricula?: string | null;
  semestre?: number | null;
  grupo?: string | null;
  creditos_aprobados?: number | null;
  estado_alumno?: string | null;
  departamento?: string | null;
  area?: string | null;
  cargo?: string | null;
  telefono?: string | null;
}
