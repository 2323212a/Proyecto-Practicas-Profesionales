export interface ResponsableEmpresa {
  id_responsable: number;
  id_empresa: number;
  nombre_completo: string | null;
  cargo: string | null;
  correo: string | null;
  telefono: string | null;
}

export interface CrearResponsableEmpresaDTO {
  id_empresa: number;
  nombre_completo: string;
  cargo: string;
  correo: string;
  telefono: string;
}