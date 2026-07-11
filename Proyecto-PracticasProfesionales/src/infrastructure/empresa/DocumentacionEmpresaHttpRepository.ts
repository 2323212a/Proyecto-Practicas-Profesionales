import type {
  DocumentacionEmpresaResponse,
  DocumentoEmpresa,
  EstadoDocumentoEmpresa,
  FormatoEmpresa,
  SubirDocumentoEmpresaInput,
  SubirFormatoEmpresaInput,
} from "../../domain/empresa/DocumentacionEmpresa";
import type { DocumentacionEmpresaRepository } from "../../domain/empresa/DocumentacionEmpresaRepository";
import { apiClient } from "../api/apiClient";

export class DocumentacionEmpresaHttpRepository implements DocumentacionEmpresaRepository {
  async listarEmpresa(idEmpresa: number): Promise<DocumentacionEmpresaResponse> {
    const { data } = await apiClient.get<DocumentacionEmpresaResponse>("/empresa/documentos/me");
    return data;
  }

  async subirDocumento(idEmpresa: number, datos: SubirDocumentoEmpresaInput): Promise<DocumentoEmpresa> {
    const { data } = await apiClient.post<DocumentoEmpresa>("/empresa/documentos/me/subir", datos);
    return data;
  }

  async listarRevision(): Promise<DocumentacionEmpresaResponse[]> {
    const { data } = await apiClient.get<DocumentacionEmpresaResponse[]>("/coord-unidades/documentos-empresa");
    return data;
  }

  async subirFormato(datos: SubirFormatoEmpresaInput): Promise<FormatoEmpresa> {
    const { data } = await apiClient.post<FormatoEmpresa>("/coord-unidades/documentos-empresa/formatos", datos);
    return data;
  }

  async revisarDocumento(
    idDocumentoEmpresa: number,
    estado: EstadoDocumentoEmpresa,
    observaciones?: string,
  ): Promise<DocumentoEmpresa> {
    const { data } = await apiClient.patch<DocumentoEmpresa>(
      `/coord-unidades/documentos-empresa/${idDocumentoEmpresa}/estado`,
      { estado_documento: estado, observaciones },
    );
    return data;
  }
}
