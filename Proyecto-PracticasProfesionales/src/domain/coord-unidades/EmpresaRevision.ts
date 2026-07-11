export interface EmpresaRevision {
  id_empresa: number;
  nombre_empresa: string;
  rfc: string | null;
  giro: string | null;
  domicilio: string | null;
  telefono: string | null;
  correo_contacto: string | null;
  estado_empresa: string;
  vacantes: number;
  vacantes_activas: number;
  padron: string;
}
