import type { AceptarSolicitudResponse, EmpresaRevision, SolicitudEmpresaDetalle } from "../../domain/coord-unidades/EmpresaRevision";
import type { EmpresaRevisionRepository } from "../../domain/coord-unidades/EmpresaRevisionRepository";
import { apiClient } from "../api/apiClient";

type EmpresaRevisionApi = EmpresaRevision;
type SolicitudEmpresaDetalleApi = SolicitudEmpresaDetalle;

function mapEmpresaRevision(item: EmpresaRevisionApi): EmpresaRevision {
  return {
    id_empresa: item.id_empresa,
    nombre_empresa: item.nombre_empresa,
    rfc: item.rfc,
    giro: item.giro,
    domicilio: item.domicilio,
    telefono: item.telefono,
    correo_contacto: item.correo_contacto,
    estado_empresa: item.estado_empresa,
    tipo_tramite: item.tipo_tramite,
    periodo_participacion: item.periodo_participacion,
    estado_solicitud: item.estado_solicitud,
    motivo_rechazo: item.motivo_rechazo,
    cuenta_creada: item.cuenta_creada,
    correo_usuario: item.correo_usuario,
    vacantes: item.vacantes,
    vacantes_activas: item.vacantes_activas,
    padron: item.padron,
  };
}

function mapSolicitudDetalle(item: SolicitudEmpresaDetalleApi): SolicitudEmpresaDetalle {
  return {
    empresa: mapEmpresaRevision(item.empresa),
    solicitud: {
      id_solicitud_empresa: item.solicitud.id_solicitud_empresa ?? null,
      tipo_tramite: item.solicitud.tipo_tramite,
      periodo_participacion: item.solicitud.periodo_participacion,
      estado_solicitud: item.solicitud.estado_solicitud,
      motivo_rechazo: item.solicitud.motivo_rechazo,
      observaciones: item.solicitud.observaciones,
      fecha_solicitud: item.solicitud.fecha_solicitud,
      fecha_revision: item.solicitud.fecha_revision,
    },
    cuenta_creada: item.cuenta_creada,
    correo_usuario: item.correo_usuario,
  };
}

export class EmpresaRevisionHttpRepository implements EmpresaRevisionRepository {
  async listar(): Promise<EmpresaRevision[]> {
    const response = await apiClient.get<EmpresaRevisionApi[]>("/coord-unidades/empresas/");
    return response.data.map(mapEmpresaRevision);
  }

  async cambiarEstado(idEmpresa: number, estado: string): Promise<void> {
    await apiClient.patch(`/coord-unidades/empresas/${idEmpresa}/estado`, {
      estado_empresa: estado,
    });
  }

  async obtenerSolicitud(idEmpresa: number): Promise<SolicitudEmpresaDetalle> {
    const { data } = await apiClient.get<SolicitudEmpresaDetalleApi>(
      `/coord-unidades/empresas/${idEmpresa}/solicitud`
    );
    return mapSolicitudDetalle(data);
  }

  async aceptarSolicitud(idEmpresa: number): Promise<AceptarSolicitudResponse> {
    const { data } = await apiClient.post<AceptarSolicitudResponse>(
      `/coord-unidades/empresas/${idEmpresa}/aceptar-solicitud`
    );
    return data;
  }

  async rechazarSolicitud(idEmpresa: number, motivo: string, observaciones?: string): Promise<void> {
    await apiClient.post(`/coord-unidades/empresas/${idEmpresa}/rechazar-solicitud`, {
      motivo_rechazo: motivo,
      observaciones,
    });
  }
}
