import type {
  DocumentacionEmpresaResponse,
  DocumentoEmpresa,
  EstadoDocumentoEmpresa,
  FormatoEmpresa,
  SubirDocumentoEmpresaInput,
  SubirFormatoEmpresaInput,
} from "./DocumentacionEmpresa";

export interface DocumentacionEmpresaRepository {
  listarEmpresa(idEmpresa: number): Promise<DocumentacionEmpresaResponse>;
  subirDocumento(idEmpresa: number, datos: SubirDocumentoEmpresaInput): Promise<DocumentoEmpresa>;
  listarRevision(): Promise<DocumentacionEmpresaResponse[]>;
  subirFormato(datos: SubirFormatoEmpresaInput): Promise<FormatoEmpresa>;
  revisarDocumento(
    idDocumentoEmpresa: number,
    estado: EstadoDocumentoEmpresa,
    observaciones?: string,
  ): Promise<DocumentoEmpresa>;
}
