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

export async function crearCarrera(data: {
  clave: string;
  nombre: string;
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
    clave: string;
    nombre: string;
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
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
}) {
  const response = await apiClient.post("/convocatorias/", data);
  return response.data;
}

export async function actualizarConvocatoria(
  id: number,
  data: {
    nombre: string;
    periodo: string;
    fecha_inicio: string;
    fecha_fin: string;
    estado: string;
  }
) {
  const response = await apiClient.put(`/convocatorias/${id}`, data);
  return response.data;
}

export async function eliminarConvocatoria(id: number) {
  const response = await apiClient.delete(`/convocatorias/${id}`);
  return response.data;
}

export async function crearTipoDocumento(data: {
  nombre_documento: string;
  descripcion?: string;
  etapa?: string;
  obligatorio: boolean;
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
  }
) {
  const response = await apiClient.put(`/tipos-documento/${id}`, data);
  return response.data;
}

export async function eliminarTipoDocumento(id: number) {
  const response = await apiClient.delete(`/tipos-documento/${id}`);
  return response.data;
}