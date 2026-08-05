import type { AceptarSolicitudResponse, EmpresaRevision, RechazarSolicitudResponse, SolicitudEmpresaDetalle } from "../../domain/coord-unidades/EmpresaRevision";
import type { EmpresaRevisionRepository } from "../../domain/coord-unidades/EmpresaRevisionRepository";
import { apiClient } from "../api/apiClient";

export class EmpresaRevisionHttpRepository implements EmpresaRevisionRepository {
  async listar(): Promise<EmpresaRevision[]> {
    const response = await apiClient.get<EmpresaRevision[]>("/coord-unidades/empresas/");
    return response.data;
  }

  async cambiarEstado(idEmpresa: number, estado: string): Promise<void> {
    await apiClient.patch(`/coord-unidades/empresas/${idEmpresa}/estado`, {
      estado_empresa: estado,
    });
  }

  async obtenerSolicitud(idEmpresa: number): Promise<SolicitudEmpresaDetalle> {
    const { data } = await apiClient.get<SolicitudEmpresaDetalle>(
      `/coord-unidades/empresas/${idEmpresa}/solicitud`
    );
    return data;
  }

  async aceptarSolicitud(idEmpresa: number): Promise<AceptarSolicitudResponse> {
    const { data } = await apiClient.post<AceptarSolicitudResponse>(
      `/coord-unidades/empresas/${idEmpresa}/aceptar-solicitud`
    );
    return data;
  }

  async rechazarSolicitud(idEmpresa: number, motivo: string, observaciones?: string): Promise<RechazarSolicitudResponse> {
    const { data } = await apiClient.post<RechazarSolicitudResponse>(`/coord-unidades/empresas/${idEmpresa}/rechazar-solicitud`, {
      motivo_rechazo: motivo,
      observaciones,
    });
    return data;
  }
}
