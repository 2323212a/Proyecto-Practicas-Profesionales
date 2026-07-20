import type {
  DocumentacionEmpresaResponse,
  DocumentoEmpresa,
  ConfigurarRequisitoEmpresaInput,
  EditarDocumentoEmpresaInput,
  FormatoEmpresa,
  RequisitoEmpresa,
  RevisarDocumentoEmpresaInput,
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
    datos: RevisarDocumentoEmpresaInput,
  ): Promise<DocumentoEmpresa>;
  editarDocumento(
    idDocumentoEmpresa: number,
    datos: EditarDocumentoEmpresaInput,
  ): Promise<DocumentoEmpresa>;
  descargarDocumento(idDocumentoEmpresa: number): Promise<Blob>;
  descargarFormato(idFormatoEmpresa: number): Promise<Blob>;
  configurarRequisito(
    idTipoDocumentoEmpresa: number,
    datos: ConfigurarRequisitoEmpresaInput,
  ): Promise<RequisitoEmpresa>;
}
