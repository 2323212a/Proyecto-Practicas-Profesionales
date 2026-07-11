import type {
  DocumentacionAlumnoResponse,
  DocumentosAlumnoResponse,
  SubirDocumentoAlumnoRequest,
} from "../../domain/alumno/DocumentoAlumno";
import type { DocumentoAlumnoRepository } from "../../domain/alumno/DocumentoAlumnoRepository";
import { apiClient } from "../api/apiClient";

export class DocumentoAlumnoHttpRepository implements DocumentoAlumnoRepository {
  async listar(_idAlumno: number): Promise<DocumentosAlumnoResponse> {
    const { data } = await apiClient.get<DocumentosAlumnoResponse>(
      "/alumno/documentos/me/"
    );
    return data;
  }

  async subir(_idAlumno: number, datos: SubirDocumentoAlumnoRequest): Promise<void> {
    await apiClient.post("/alumno/documentos/me/subir", datos);
  }

  async obtenerDocumentacion(): Promise<DocumentacionAlumnoResponse> {
    const { data } = await apiClient.get<DocumentacionAlumnoResponse>(
      "/alumno/documentos/documentacion"
    );
    return data;
  }

  async subirArchivo(idDocumento: number, archivo: File): Promise<DocumentacionAlumnoResponse> {
    const formData = new FormData();
    formData.append("archivo", archivo);
    const { data } = await apiClient.post<DocumentacionAlumnoResponse>(
      `/alumno/documentos/documentos/${idDocumento}/archivo`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );
    return data;
  }

  async descargarArchivo(idDocumento: number): Promise<Blob> {
    const { data } = await apiClient.get(`/alumno/documentos/documentos/${idDocumento}/archivo`, {
      responseType: "blob",
    });
    return data;
  }

  async descargarGenerado(codigo: string): Promise<Blob> {
    const { data } = await apiClient.get(`/alumno/documentos/generados/${codigo}/descargar`, {
      responseType: "blob",
    });
    return data;
  }
}
