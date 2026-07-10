import { apiClient } from "../api/apiClient";

export interface EmpresaApi {
  id_empresa: number;
  id_usuario?: number | null;
  nombre_empresa: string;
  rfc: string;
  giro: string;
  domicilio: string;
  telefono?: string | null;
  correo_contacto?: string | null;
  estado_empresa: string;
  fecha_registro?: string | null;
  fecha_validacion?: string | null;
}

export interface ConvenioApi {
  id_convenio: number;
  id_empresa: number;
  fecha_inicio: string;
  fecha_fin: string;
  documento_convenio: string;
  tipo_convenio: string;
  estado_convenio: string;
  observaciones: string;
}

export interface ResponsableEmpresaApi {
  id_responsable: number;
  id_empresa: number;
  nombre_completo: string;
  cargo?: string | null;
  correo?: string | null;
  telefono?: string | null;
  activo: boolean;
}

export interface PadronEmpresarialApi {
  id_empresa: number;
  nombre_empresa: string;
  rfc: string;
  estado_empresa: string;
  id_convenio?: number | null;
  estado_convenio?: string | null;
  id_vacante?: number | null;
  titulo?: string | null;
  estado_vacante?: string | null;
}

export interface VacanteApi {
  id_vacante: number;
  id_empresa: number;
  id_carrera?: number | null;
  titulo?: string | null;
  descripcion?: string | null;
  modalidad?: string | null;
  cupo_total?: number | null;
  cupo_disponible?: number | null;
  estado_vacante: string;
  fecha_publicacion?: string | null;
}

export interface NotificacionApi {
  id_notificacion: number;
  id_usuario?: number | null;
  titulo: string;
  mensaje: string;
  tipo: string;
  leida: boolean;
  fecha_envio?: string | null;
}

export interface NotificacionCreateApi {
  id_usuario?: number | null;
  titulo: string;
  mensaje: string;
  tipo?: string;
}

export interface SolicitudUnidadRequest {
  nombre_empresa: string;
  rfc: string;
  giro: string;
  domicilio: string;
  telefono: string;
  correo_contacto: string;
}

export interface SolicitudUnidadResponse {
  success: boolean;
  message: string;
  id_empresa: number;
  id_solicitud: number;
}

export interface SolicitudUnidadListado {
  id_solicitud: number;
  id_empresa: number;
  nombre_empresa: string;
  rfc: string;
  giro: string;
  telefono?: string | null;
  correo_contacto?: string | null;
  estado: string;
  fecha_solicitud?: string | null;
}

export interface SolicitudUnidadRechazoRequest {
  motivo_rechazo: string;
  observaciones: string;
}

export async function registrarSolicitudUnidad(payload: SolicitudUnidadRequest) {
  const { data } = await apiClient.post<SolicitudUnidadResponse>(
    "/api/public/unidades-receptoras/solicitud",
    payload
  );
  return data;
}

export async function listarSolicitudes(
  estado?: string,
  nombre_empresa?: string,
  rfc?: string
) {
  const params = new URLSearchParams();
  if (estado) params.append("estado", estado);
  if (nombre_empresa) params.append("nombre_empresa", nombre_empresa);
  if (rfc) params.append("rfc", rfc);
  
  const queryString = params.toString();
  const url = queryString
    ? `/api/coordinador/unidades-receptoras/solicitudes?${queryString}`
    : `/api/coordinador/unidades-receptoras/solicitudes`;
  
  const { data } = await apiClient.get<SolicitudUnidadListado[]>(url);
  return data;
}

export async function aprobarSolicitud(idSolicitud: number) {
  const { data } = await apiClient.patch<SolicitudUnidadResponse>(
    `/api/coordinador/unidades-receptoras/solicitudes/${idSolicitud}/aprobar`
  );
  return data;
}

export async function rechazarSolicitud(
  idSolicitud: number,
  payload: SolicitudUnidadRechazoRequest
) {
  const { data } = await apiClient.patch<SolicitudUnidadResponse>(
    `/api/coordinador/unidades-receptoras/solicitudes/${idSolicitud}/rechazar`,
    payload
  );
  return data;
}

export async function listarEmpresas() {
  const { data } = await apiClient.get<EmpresaApi[]>("/empresas/");
  return data;
}

export async function validarEmpresa(idEmpresa: number) {
  const { data } = await apiClient.put(`/empresas/${idEmpresa}/validar`);
  return data;
}

export async function listarConvenios() {
  const { data } = await apiClient.get<ConvenioApi[]>("/convenios/");
  return data;
}

export async function crearConvenio(payload: Omit<ConvenioApi, "id_convenio" | "estado_convenio">) {
  const { data } = await apiClient.post<ConvenioApi>("/convenios/", payload);
  return data;
}

export async function actualizarConvenio(idConvenio: number, payload: Omit<ConvenioApi, "id_convenio" | "estado_convenio">) {
  const { data } = await apiClient.put<ConvenioApi>(`/convenios/${idConvenio}`, payload);
  return data;
}

export async function listarResponsablesEmpresa(idEmpresa: number) {
  const { data } = await apiClient.get<ResponsableEmpresaApi[]>(`/responsables/empresa/${idEmpresa}`);
  return data;
}

export async function crearResponsableEmpresa(payload: Omit<ResponsableEmpresaApi, "id_responsable">) {
  const { data } = await apiClient.post<ResponsableEmpresaApi>("/responsables/", payload);
  return data;
}

export async function listarPadronEmpresarial() {
  const { data } = await apiClient.get<PadronEmpresarialApi[]>("/padron-empresarial/");
  return data;
}

export async function listarVacantes() {
  const { data } = await apiClient.get<VacanteApi[]>("/vacantes/");
  return data;
}

export async function aprobarVacante(idVacante: number) {
  const { data } = await apiClient.put<VacanteApi>(`/vacantes/${idVacante}/aprobar`);
  return data;
}

export async function listarNotificaciones() {
  const { data } = await apiClient.get<NotificacionApi[]>("/notificaciones/");
  return data;
}

export async function enviarNotificacion(payload: NotificacionCreateApi) {
  const { data } = await apiClient.post<NotificacionApi>("/notificaciones/", payload);
  return data;
}
