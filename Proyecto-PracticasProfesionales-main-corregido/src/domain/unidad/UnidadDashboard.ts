import type { AlumnoUnidad } from "./AlumnoUnidad";

export interface EmpresaUnidadBasica {
  id_empresa: number;
  nombre_empresa: string;
  rfc: string | null;
  giro: string | null;
  domicilio: string | null;
  telefono: string | null;
  correo_contacto: string | null;
  estado_empresa: string;
  tipo_tramite: string | null;
}

export interface ResumenUnidadDashboard {
  alumnos_activos: number;
  planes_trabajo: number;
  convenios_vigentes: number;
  horas_registradas: number;
  evaluaciones_pendientes: number;
}

export interface VacanteUnidadResumen {
  id_vacante: number;
  titulo: string;
  estado_vacante: string;
  cupos: number;
  periodo: string | null;
  tipo_practica?: string | null;
}

export interface ConvenioUnidadResumen {
  id_convenio: number;
  fecha_inicio: string;
  fecha_fin: string;
  estado_convenio: string;
  es_actual: boolean;
  observaciones: string | null;
}

export interface UnidadDashboardResponse {
  empresa: EmpresaUnidadBasica;
  resumen: ResumenUnidadDashboard;
  alumnos: AlumnoUnidad[];
  vacantes: VacanteUnidadResumen[];
  convenios: ConvenioUnidadResumen[];
  evaluaciones_pendientes: AlumnoUnidad[];
}

export interface ResponsableUnidad {
  id_responsable: number;
  nombre: string;
  cargo: string;
  correo: string | null;
  telefono: string | null;
}

export interface PerfilUnidadResponse {
  empresa: EmpresaUnidadBasica;
  resumen: {
    alumnos_asignados: number;
    convenios_vigentes: number;
    planes_disponibles: number;
  };
  responsables: ResponsableUnidad[];
  vacantes: Array<{
    id_vacante: number;
    titulo: string;
    descripcion: string | null;
    actividades: string | null;
    requisitos: string | null;
    cupos: number;
    periodo: string | null;
    estado_vacante: string;
  }>;
  convenios: ConvenioUnidadResumen[];
}
