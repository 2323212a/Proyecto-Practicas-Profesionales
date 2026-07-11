import type { AceptarSolicitudResponse, EmpresaRevision, SolicitudEmpresaDetalle } from "../../domain/coord-unidades/EmpresaRevision";
import type { EmpresaRevisionRepository } from "../../domain/coord-unidades/EmpresaRevisionRepository";

export class GestionEmpresasRevisionUseCase {
  private readonly repository: EmpresaRevisionRepository;

  constructor(repository: EmpresaRevisionRepository) {
    this.repository = repository;
  }

  listar(): Promise<EmpresaRevision[]> {
    return this.repository.listar();
  }

  cambiarEstado(idEmpresa: number, estado: string): Promise<void> {
    return this.repository.cambiarEstado(idEmpresa, estado);
  }

  obtenerSolicitud(idEmpresa: number): Promise<SolicitudEmpresaDetalle> {
    return this.repository.obtenerSolicitud(idEmpresa);
  }

  aceptarSolicitud(idEmpresa: number): Promise<AceptarSolicitudResponse> {
    return this.repository.aceptarSolicitud(idEmpresa);
  }

  rechazarSolicitud(idEmpresa: number, motivo: string, observaciones?: string): Promise<void> {
    return this.repository.rechazarSolicitud(idEmpresa, motivo, observaciones);
  }
}
