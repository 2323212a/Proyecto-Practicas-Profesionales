export type EstadoValidacionEmpresa = "Válido" | "Con advertencias" | "Inválido";

export interface FilaValidacionEmpresa {
  fila: number;
  nombre: string;
  rfc: string;
  tipo_unidad: string;
  municipio: string;
  estado: string;
  responsable: string;
  capacidad: string;
  estatus_validacion: EstadoValidacionEmpresa;
  errores: string[];
  advertencias: string[];
  duplicada: boolean;
  id_existente: number | null;
}

export interface ValidacionImportacionEmpresas {
  id_importacion: string;
  resumen: {
    total: number;
    validas: number;
    con_advertencias: number;
    invalidas: number;
  };
  errores_generales: string[];
  filas: FilaValidacionEmpresa[];
  puede_confirmar: boolean;
}

export interface ResultadoFilaImportacionEmpresa {
  fila: number;
  nombre: string;
  rfc: string;
  resultado: string;
  id_empresa?: number;
  id_existente?: number | null;
  advertencias: string[];
  errores: string[];
  fecha_procesamiento: string;
}

export interface ResultadoImportacionEmpresas {
  id_importacion: string;
  resumen: {
    total: number;
    creadas: number;
    omitidas: number;
    con_advertencias: number;
    con_errores: number;
  };
  resultados: ResultadoFilaImportacionEmpresa[];
  reporte_disponible: boolean;
}
