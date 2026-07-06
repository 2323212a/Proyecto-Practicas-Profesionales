export interface Empresa {
  id_empresa: number;
  id_usuario: number | null;
  nombre_empresa: string;
  rfc: string | null;
  giro: string | null;
  domicilio: string | null;
  telefono: string | null;
  correo_contacto: string | null;
  estado_empresa: string;
}

export interface CrearEmpresaDTO {
  id_usuario?: number | null;
  nombre_empresa: string;
  rfc?: string | null;
  giro?: string | null;
  domicilio?: string | null;
  telefono?: string | null;
  correo_contacto?: string | null;
}