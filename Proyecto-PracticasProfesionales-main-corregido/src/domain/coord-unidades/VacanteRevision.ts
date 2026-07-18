export interface VacanteRevision {
  id_vacante: number;
  id_empresa: number;
  empresa: string;
  estado_empresa: string;
  id_convocatoria: number;
  convocatoria: string | null;
  id_tipo_practica: number;
  tipo_practica: string | null;
  titulo: string;
  descripcion: string | null;
  actividades: string | null;
  requisitos: string | null;
  cupos: number;
  cupo_ocupado: number;
  estado_vacante: string;
  observaciones: string | null;
  periodo: string | null;
  publicable: boolean;
}
