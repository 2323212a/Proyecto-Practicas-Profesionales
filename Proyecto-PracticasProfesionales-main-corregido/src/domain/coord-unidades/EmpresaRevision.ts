export interface EmpresaRevision {
  id_empresa: number;
  nombre_empresa: string;
  rfc: string | null;
  giro: string | null;
  domicilio: string | null;
  telefono: string | null;
  correo_contacto: string | null;
  estado_empresa: string;
  tipo_tramite: string | null;
  estado_solicitud: string | null;
  motivo_rechazo: string | null;
  cuenta_creada: boolean;
  correo_usuario: string | null;
  vacantes: number;
  vacantes_activas: number;
  padron: string;
}

export interface SolicitudEmpresaDetalle {
  empresa: EmpresaRevision;
  solicitud: {
    tipo_tramite: string | null;
    estado_solicitud: string | null;
    motivo_rechazo: string | null;
    observaciones: string | null;
    fecha_solicitud: string | null;
    fecha_revision: string | null;
  };
  cuenta_creada: boolean;
  correo_usuario: string | null;
}

export interface AceptarSolicitudResponse {
  mensaje: string;
  cuenta_creada: boolean;
  correo: string;
  password_temporal: string | null;
  correo_enviado: boolean;
  advertencia_correo: string | null;
}

export interface RechazarSolicitudResponse {
  mensaje: string;
  estado_empresa: string;
  correo_enviado: boolean;
  advertencia_correo: string | null;
}
