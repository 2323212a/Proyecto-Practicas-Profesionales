export interface ConfiguracionSistema {
  id_configuracion?: number;
  nombre_sistema: string;
  escuela_facultad: string;
  correo_institucional: string;
  estado_sistema: string;
  inscripcion_empresas_estado: string;
  inscripcion_empresas_motivo?: string | null;
  ciclo_escolar: string;
  hero_titulo: string;
  hero_subtitulo: string;
  id_convocatoria_principal: number | null;
  convocatoria_nombre: string;
  convocatoria_inicio: string | null;
  convocatoria_cierre: string | null;
  convocatoria_empresas_inicio?: string | null;
  convocatoria_empresas_cierre?: string | null;
  convocatoria_periodo?: string | null;
  convocatoria_estado?: string | null;
  soporte_telefono: string | null;
  ultima_actualizacion?: string | null;
}
