export interface ResumenDocumentalAlumno {
  aprobados: number;
  revision: number;
  observados: number;
  faltantes: number;
  cargados: number;
  total: number;
}

export interface AlumnoGestionCoordinador {
  id_alumno: number;
  id_expediente: number | null;
  nombre: string;
  correo: string | null;
  matricula: string;
  semestre: number | null;
  grupo: string | null;
  carrera: string;
  estado_alumno: string;
  estado_expediente: string;
  empresa: string;
  docente: string;
  tipo_asignacion: string;
  horas_aprobadas: number;
  fase: string;
  estado_documental: string;
  siguiente_paso: string;
  prioridad: number;
  inicial_aprobado: boolean;
  seleccion_realizada: boolean;
  resumen: ResumenDocumentalAlumno;
}

export interface CoordinadorDashboardMetricas {
  total_alumnos: number;
  alumnos_en_revision: number;
  docs_revisados: number;
  empresas_disponibles: number;
  expedientes_aprobados: number;
  selecciones_registradas: number;
  asignaciones_activas: number;
}

export interface EstadoDocumentoDashboard {
  name: string;
  value: number;
  color: string;
}

export interface CoordinadorDashboardResponse {
  metricas: CoordinadorDashboardMetricas;
  estado_documentos: EstadoDocumentoDashboard[];
  expedientes_por_revisar: AlumnoGestionCoordinador[];
}
