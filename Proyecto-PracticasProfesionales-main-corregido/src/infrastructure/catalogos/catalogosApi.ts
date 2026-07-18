import { apiClient } from "../api/apiClient";

export async function obtenerCarreras() {
  const response = await apiClient.get("/carreras/");
  return response.data;
}

export async function obtenerConvocatorias() {
  const response = await apiClient.get("/convocatorias/");
  return response.data;
}

export async function obtenerTiposDocumento() {
  const response = await apiClient.get("/tipos-documento/");
  return response.data;
}

export async function obtenerTiposPractica() {
  const response = await apiClient.get("/tipos-practica/");
  return response.data;
}

export async function actualizarTipoPractica(
  id: number,
  data: {
    nombre?: string;
    semestre_requerido?: number | null;
    creditos_minimos?: number | null;
    horas_requeridas?: number | null;
    orden?: number | null;
    activo?: boolean;
  }
) {
  const response = await apiClient.patch(`/tipos-practica/${id}`, data);
  return response.data;
}

export async function crearTipoPractica(data: {
  nombre: string;
  semestre_requerido: number;
  creditos_minimos: number;
  horas_requeridas: number;
  orden?: number | null;
  activo: boolean;
}) {
  const response = await apiClient.post("/tipos-practica/", data);
  return response.data;
}

export async function validarAlumnosMasivo(archivo: File) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  const response = await apiClient.post(
    "/importacion/validar-alumnos",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

export async function validarPersonalMasivo(archivo: File) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  const response = await apiClient.post(
    "/importacion/validar-personal",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

export async function importarAlumnosMasivo(archivo: File) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  const response = await apiClient.post(
    "/importacion/importar-alumnos",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

export async function importarPersonalMasivo(archivo: File) {
  const formData = new FormData();
  formData.append("archivo", archivo);

  const response = await apiClient.post(
    "/importacion/importar-personal",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return response.data;
}

export async function crearCarrera(data: {
  nombre: string;
  tipo_periodo: string;
  estado: string;
}) {
  const response = await apiClient.post(
    "/carreras/",
    data
  );

  return response.data;
}

export async function actualizarCarrera(
  id: number,
  data: {
    nombre: string;
    tipo_periodo: string;
    estado: string;
  }
) {
  const response = await apiClient.put(
    `/carreras/${id}`,
    data
  );

  return response.data;
}

export async function eliminarCarrera(id: number) {
  const response = await apiClient.delete(
    `/carreras/${id}`
  );

  return response.data;
}

export async function crearConvocatoria(data: {
  nombre: string;
  tipo_periodo: string;
  estado: string;
  fecha_inicio_general?: string | null;
  fecha_cierre_general?: string | null;
  fecha_inicio_empresas?: string | null;
  fecha_cierre_empresas?: string | null;
  fecha_inicio_documentos?: string | null;
  fecha_cierre_documentos?: string | null;
  fecha_inicio_validacion?: string | null;
  fecha_cierre_validacion?: string | null;
  fecha_inicio_seleccion?: string | null;
  fecha_cierre_seleccion?: string | null;
  fecha_inicio_asignacion?: string | null;
  fecha_cierre_asignacion?: string | null;
  fecha_inicio_practicas?: string | null;
  fecha_cierre_practicas?: string | null;
  fecha_inicio_cierre?: string | null;
  fecha_cierre_cierre?: string | null;
  observaciones?: string | null;
}) {
  const response = await apiClient.post("/convocatorias/", data);
  return response.data;
}

export async function actualizarConvocatoria(
  id: number,
  data: {
    nombre: string;
    tipo_periodo: string;
    estado: string;
    fecha_inicio_general?: string | null;
    fecha_cierre_general?: string | null;
    fecha_inicio_empresas?: string | null;
    fecha_cierre_empresas?: string | null;
    fecha_inicio_documentos?: string | null;
    fecha_cierre_documentos?: string | null;
    fecha_inicio_validacion?: string | null;
    fecha_cierre_validacion?: string | null;
    fecha_inicio_seleccion?: string | null;
    fecha_cierre_seleccion?: string | null;
    fecha_inicio_asignacion?: string | null;
    fecha_cierre_asignacion?: string | null;
    fecha_inicio_practicas?: string | null;
    fecha_cierre_practicas?: string | null;
    fecha_inicio_cierre?: string | null;
    fecha_cierre_cierre?: string | null;
    observaciones?: string | null;
  }
) {
  const response = await apiClient.put(`/convocatorias/${id}`, data);
  return response.data;
}

export async function eliminarConvocatoria(id: number) {
  const response = await apiClient.delete(`/convocatorias/${id}`);
  return response.data;
}

export async function desactivarConvocatoria(id: number) {
  const response = await apiClient.patch(`/convocatorias/${id}/desactivar`);
  return response.data;
}

export async function cerrarConvocatoria(id: number) {
  const response = await apiClient.patch(`/convocatorias/${id}/cerrar`);
  return response.data;
}

export async function crearTipoDocumento(data: {
  nombre_documento: string;
  descripcion?: string;
  etapa?: string;
  obligatorio: boolean;
  requiere_formato: boolean;
}) {
  const response = await apiClient.post("/tipos-documento/", data);
  return response.data;
}

export async function actualizarTipoDocumento(
  id: number,
  data: {
    nombre_documento: string;
    descripcion?: string;
    etapa?: string;
    obligatorio: boolean;
    requiere_formato: boolean;
  }
) {
  const response = await apiClient.put(`/tipos-documento/${id}`, data);
  return response.data;
}

export async function eliminarTipoDocumento(id: number) {
  const response = await apiClient.delete(`/tipos-documento/${id}`);
  return response.data;
}
