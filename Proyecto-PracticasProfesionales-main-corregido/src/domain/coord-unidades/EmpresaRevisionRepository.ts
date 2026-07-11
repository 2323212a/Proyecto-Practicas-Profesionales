import type { AceptarSolicitudResponse, EmpresaRevision, SolicitudEmpresaDetalle } from "./EmpresaRevision";

export interface EmpresaRevisionRepository {
  listar(): Promise<EmpresaRevision[]>;
  cambiarEstado(idEmpresa: number, estado: string): Promise<void>;
  obtenerSolicitud(idEmpresa: number): Promise<SolicitudEmpresaDetalle>;
  aceptarSolicitud(idEmpresa: number): Promise<AceptarSolicitudResponse>;
  rechazarSolicitud(idEmpresa: number, motivo: string, observaciones?: string): Promise<void>;
}
