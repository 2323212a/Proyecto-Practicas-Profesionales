export interface VacanteRevision {
  id_vacante: number;
  id_empresa: number;
  empresa: string;
  estado_empresa: string;
  id_carrera: number;
  carrera: string;
  titulo: string;
  descripcion: string | null;
  modalidad: string;
  horario: string | null;
  cupo_total: number;
  cupo_disponible: number;
  cupo_ocupado: number;
  estado_vacante: string;
  observaciones: string | null;
  periodo: string | null;
  id_tipo_practica: number | null;
  tipo_practica: string | null;
  id_convocatoria: number | null;
  publicable: boolean;
}
