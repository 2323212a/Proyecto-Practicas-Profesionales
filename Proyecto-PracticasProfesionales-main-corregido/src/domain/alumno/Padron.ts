export interface VacantePadron {
  id_vacante: number;
  id_empresa: number;
  empresa: string;
  giro: string | null;
  domicilio: string | null;
  correo_contacto: string | null;
  telefono: string | null;
  titulo: string;
  descripcion: string | null;
  modalidad: string;
  horario: string | null;
  cupo_disponible: number;
  cupo_total: number;
  carrera: string;
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
  id_vacante: number | null;
  prioridad: number;
  estado_seleccion: "Pendiente" | "Aprobada" | "Rechazada";
  observaciones: string | null;
  fecha_revision: string | null;
}

export interface PreferenciaEmpresaRequest {
  id_empresa: number;
  prioridad: number;
}

export interface EmpresaAsignadaAlumno extends EmpresaPadronDisponible {
  vacante: string | null;
  modalidad: string | null;
  horario: string | null;
  fecha_asignacion: string;
}

export interface PadronAlumnoResponse {
  puede_seleccionar: boolean;
  motivo_bloqueo: string | null;
  estado_alumno: string;
  empresa_asignada: EmpresaAsignadaAlumno | null;
  empresas: EmpresaPadronDisponible[];
  vacantes: VacantePadron[];
  selecciones: SeleccionEmpresaAlumno[];
}
