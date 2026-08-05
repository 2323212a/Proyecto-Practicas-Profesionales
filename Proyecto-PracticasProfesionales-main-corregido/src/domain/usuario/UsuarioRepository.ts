import type {
  ActualizarUsuario,
  ActualizarUsuarioPerfil,
  CrearUsuario,
  Usuario,
  UsuarioPerfil,
} from "./Usuario";

export interface UsuarioRepository {
  listar(): Promise<Usuario[]>;
  crear(data: CrearUsuario): Promise<Usuario>;
  actualizar(id: number, data: ActualizarUsuario): Promise<Usuario>;
  obtenerPerfil(id: number): Promise<UsuarioPerfil>;
  actualizarPerfil(id: number, data: ActualizarUsuarioPerfil): Promise<UsuarioPerfil>;
  cambiarEstado(id: number): Promise<Usuario>;
  eliminar(id: number): Promise<void>;
  eliminarDefinitivamente(id: number): Promise<void>;
}
