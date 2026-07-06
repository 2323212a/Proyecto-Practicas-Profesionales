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
