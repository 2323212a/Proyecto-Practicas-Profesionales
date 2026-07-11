import type {
  DocumentacionEmpresaResponse,
  DocumentoEmpresa,
  ConfigurarRequisitoEmpresaInput,
  EditarDocumentoEmpresaInput,
  FormatoEmpresa,
  RevisarDocumentoEmpresaInput,
  SubirDocumentoEmpresaInput,
  SubirFormatoEmpresaInput,
} from "../../domain/empresa/DocumentacionEmpresa";
import type { DocumentacionEmpresaRepository } from "../../domain/empresa/DocumentacionEmpresaRepository";
import { apiClient } from "../api/apiClient";

export class DocumentacionEmpresaHttpRepository implements DocumentacionEmpresaRepository {
  async listarEmpresa(_idEmpresa: number): Promise<DocumentacionEmpresaResponse> {
    const { data } = await apiClient.get<DocumentacionEmpresaResponse>("/empresa/documentos/me");
    return data;
  }

  async subirDocumento(_idEmpresa: number, datos: SubirDocumentoEmpresaInput): Promise<DocumentoEmpresa> {
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
    datos: RevisarDocumentoEmpresaInput,
  ): Promise<DocumentoEmpresa> {
    const { data } = await apiClient.patch<DocumentoEmpresa>(
      `/coord-unidades/documentos-empresa/${idDocumentoEmpresa}/estado`,
      datos,
    );
    return data;
  }

  async editarDocumento(
    idDocumentoEmpresa: number,
    datos: EditarDocumentoEmpresaInput,
  ): Promise<DocumentoEmpresa> {
    const { data } = await apiClient.put<DocumentoEmpresa>(
      `/coord-unidades/documentos-empresa/${idDocumentoEmpresa}/archivo`,
      datos,
    );
    return data;
  }

  async configurarRequisito(
    idTipoDocumentoEmpresa: number,
    datos: ConfigurarRequisitoEmpresaInput,
  ) {
    const { data } = await apiClient.put(
      `/coord-unidades/documentos-empresa/requisitos/${idTipoDocumentoEmpresa}`,
      datos,
    );
    return data;
  }
}
