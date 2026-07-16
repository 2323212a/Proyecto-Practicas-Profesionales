import type { VacanteRevision } from "../../domain/coord-unidades/VacanteRevision";
import type {
  LiberarPrepadronFiltros,
  VacanteRevisionRepository,
} from "../../domain/coord-unidades/VacanteRevisionRepository";
import { apiClient } from "../api/apiClient";

type VacanteRevisionApi = VacanteRevision;

function mapVacanteRevision(item: VacanteRevisionApi): VacanteRevision {
  return {
    id_vacante: item.id_vacante,
    id_empresa: item.id_empresa,
    empresa: item.empresa,
    estado_empresa: item.estado_empresa,
    carrera: item.carrera,
    titulo: item.titulo,
    descripcion: item.descripcion,
    modalidad: item.modalidad,
    cupo_total: item.cupo_total,
    cupo_disponible: item.cupo_disponible,
    cupo_ocupado: item.cupo_ocupado,
    estado_vacante: item.estado_vacante,
    observaciones: item.observaciones,
    periodo: item.periodo,
    id_tipo_practica: item.id_tipo_practica,
    tipo_practica: item.tipo_practica,
    id_convocatoria: item.id_convocatoria,
    publicable: item.publicable,
  };
}

export class VacanteRevisionHttpRepository implements VacanteRevisionRepository {
  async listar(): Promise<VacanteRevision[]> {
    const { data } = await apiClient.get<VacanteRevisionApi[]>(
      "/coord-unidades/empresas/vacantes/"
    );
    return data.map(mapVacanteRevision);
  }

  async cambiarEstado(idVacante: number, estado: string, observaciones?: string): Promise<void> {
    await apiClient.patch(`/coord-unidades/empresas/vacantes/${idVacante}/estado`, {
      estado_vacante: estado,
      observaciones,
    });
  }

  async liberarPrepadron(filtros?: LiberarPrepadronFiltros): Promise<void> {
    const payload = {
      id_convocatoria: filtros?.id_convocatoria,
      periodo: filtros?.periodo,
      id_tipo_practica: filtros?.id_tipo_practica,
    };
    await apiClient.post("/coord-unidades/empresas/vacantes/liberar-prepadron", payload);
  }
}
