import type {
  ActualizarUsuario,
  ActualizarUsuarioPerfil,
  CrearUsuario,
  Usuario,
  UsuarioPerfil,
} from "../../domain/usuario/Usuario";
import type { UsuarioRepository } from "../../domain/usuario/UsuarioRepository";

export class GestionUsuariosUseCase {
  private readonly repository: UsuarioRepository;

  constructor(repository: UsuarioRepository) {
    this.repository = repository;
  }

  listar(): Promise<Usuario[]> {
    return this.repository.listar();
  }

  crear(data: CrearUsuario): Promise<Usuario> {
    return this.repository.crear(data);
  }

  actualizar(id: number, data: ActualizarUsuario): Promise<Usuario> {
    return this.repository.actualizar(id, data);
  }

  obtenerPerfil(id: number): Promise<UsuarioPerfil> {
    return this.repository.obtenerPerfil(id);
  }

  actualizarPerfil(id: number, data: ActualizarUsuarioPerfil): Promise<UsuarioPerfil> {
    return this.repository.actualizarPerfil(id, data);
  }

  cambiarEstado(id: number): Promise<Usuario> {
    return this.repository.cambiarEstado(id);
  }

  eliminar(id: number): Promise<void> {
    return this.repository.eliminar(id);
  }

  eliminarDefinitivamente(id: number): Promise<void> {
    return this.repository.eliminarDefinitivamente(id);
  }
}
