import type { NotificacionRepository } from "../../domain/notificaciones/NotificacionRepository";

export class GestionNotificacionesUseCase {
  private readonly repository: NotificacionRepository;

  constructor(repository: NotificacionRepository) {
    this.repository = repository;
  }

  listarPorUsuario(idUsuario: number) {
    return this.repository.listarPorUsuario(idUsuario);
  }

  resumenPorUsuario(idUsuario: number) {
    return this.repository.resumenPorUsuario(idUsuario);
  }

  marcarLeida(idNotificacion: number) {
    return this.repository.marcarLeida(idNotificacion, true);
  }

  marcarTodas(idUsuario: number) {
    return this.repository.marcarTodas(idUsuario);
  }

  limpiarBandeja(idUsuario: number) {
    return this.repository.limpiarBandeja(idUsuario);
  }
}
