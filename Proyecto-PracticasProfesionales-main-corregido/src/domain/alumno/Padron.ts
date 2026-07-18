export interface VacantePadron {
  id_vacante: number;
  id_empresa: number;
  empresa: string;
  giro: string | null;
  domicilio: string | null;
  correo_contacto: string | null;
  telefono: string | null;
  id_convocatoria: number;
  convocatoria: string | null;
  id_tipo_practica: number;
  tipo_practica: string | null;
  titulo: string;
  descripcion: string | null;
  actividades: string | null;
  requisitos: string | null;
  cupos: number;
  cupos_usados: number;
  periodo: string;
  estado_vacante: string;
}

export interface EmpresaPadronDisponible {
  id_empresa: number;
  nombre: string;
  giro: string | null;
  domicilio: string | null;
  correo_contacto: string | null;
  telefono: string | null;
}

export interface SeleccionEmpresaAlumno {
  id_seleccion: number;
  id_empresa: number;
  id_convocatoria: number;
  id_vacante: number | null;
  prioridad: number;
  estado_seleccion: "Pendiente" | "Aprobada" | "Rechazada";
  observaciones: string | null;
  fecha_revision: string | null;
}

export interface PreferenciaVacanteRequest {
  id_vacante: number;
  prioridad: number;
}

export interface EmpresaAsignadaAlumno extends EmpresaPadronDisponible {
  vacante: string | null;
  convocatoria: string | null;
  tipo_practica: string | null;
  periodo: string | null;
  fecha_asignacion: string;
}

export interface PadronAlumnoResponse {
  elegible?: boolean;
  puede_seleccionar: boolean;
  motivo_bloqueo: string | null;
  estado_alumno: string;
  alumno?: {
    semestre: number | null;
    creditos_aprobados: number;
  };
  tipo_practica?: {
    id_tipo_practica?: number;
    nombre: string;
    semestre_requerido: number | null;
    creditos_minimos: number | null;
    orden: number | null;
  } | null;
  convocatoria: {
    id_convocatoria: number;
    nombre: string;
    tipo_periodo: string;
  } | null;
  empresa_asignada: EmpresaAsignadaAlumno | null;
  empresas: EmpresaPadronDisponible[];
  vacantes: VacantePadron[];
  selecciones: SeleccionEmpresaAlumno[];
}
