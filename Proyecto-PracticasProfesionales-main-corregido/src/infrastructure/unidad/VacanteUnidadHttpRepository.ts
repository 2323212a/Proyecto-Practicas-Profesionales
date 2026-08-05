import type {
  ConvocatoriaBasica,
  ConvocatoriaDisponibleUnidad,
  CrearVacanteUnidadInput,
  VacanteUnidad,
  VacantesUnidadResponse,
} from "../../domain/unidad/VacanteUnidad";
import type { VacanteUnidadRepository } from "../../domain/unidad/VacanteUnidadRepository";
import { apiClient } from "../api/apiClient";

export class VacanteUnidadHttpRepository implements VacanteUnidadRepository {
  async listar(_idEmpresa: number): Promise<VacantesUnidadResponse> {
    const { data } = await apiClient.get<VacantesUnidadResponse>("/unidad/me/vacantes");
    return data;
  }

  async crear(_idEmpresa: number, datos: CrearVacanteUnidadInput): Promise<VacanteUnidad> {
    const { data } = await apiClient.post<VacanteUnidad>("/unidad/me/vacantes", datos);
    return data;
  }

  async obtenerDetalle(idVacante: number): Promise<VacanteUnidad> {
    const { data } = await apiClient.get<VacanteUnidad>(`/unidad/vacantes/${idVacante}/detalle`);
    return data;
  }

  async editar(idVacante: number, datos: CrearVacanteUnidadInput): Promise<VacanteUnidad> {
    const { data } = await apiClient.put<VacanteUnidad>(`/unidad/vacantes/${idVacante}`, datos);
    return data;
  }

  async subirPlanTrabajo(idVacante: number, archivo: File): Promise<VacanteUnidad["plan_trabajo"]> {
    const formData = new FormData();
    formData.append("archivo", archivo);
    const { data } = await apiClient.post<VacanteUnidad["plan_trabajo"]>(`/unidad/vacantes/${idVacante}/plan-trabajo`, formData);
    return data;
  }

  async reenviar(idVacante: number): Promise<void> {
    await apiClient.post(`/unidad/vacantes/${idVacante}/reenviar`);
  }

  async obtenerFormatoPlanTrabajo(idConvocatoria?: number): Promise<VacanteUnidad["formato_plan_trabajo"]> {
    const params = idConvocatoria ? { id_convocatoria: idConvocatoria } : undefined;
    const { data } = await apiClient.get<VacanteUnidad["formato_plan_trabajo"]>("/unidad/vacantes/formatos-plan-trabajo", { params });
    return data;
  }

  async listarConvocatorias(): Promise<ConvocatoriaBasica[]> {
    const { data } = await apiClient.get<ConvocatoriaBasica[]>("/unidad/catalogos/convocatorias");
    return data;
  }

  async listarConvocatoriasDisponibles(): Promise<ConvocatoriaDisponibleUnidad[]> {
    const { data } = await apiClient.get<{ convocatorias: ConvocatoriaDisponibleUnidad[] }>("/unidad/convocatorias-disponibles");
    return data.convocatorias;
  }

  async solicitarParticipacion(idConvocatoria: number): Promise<void> {
    await apiClient.post("/unidad/participaciones", { id_convocatoria: idConvocatoria });
  }
}
