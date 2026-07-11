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

export class GestionDocumentacionEmpresaUseCase {
  private readonly repository: DocumentacionEmpresaRepository;

  constructor(repository: DocumentacionEmpresaRepository) {
    this.repository = repository;
  }

  listarEmpresa(idEmpresa: number): Promise<DocumentacionEmpresaResponse> {
    return this.repository.listarEmpresa(idEmpresa);
  }

  subirDocumento(idEmpresa: number, datos: SubirDocumentoEmpresaInput): Promise<DocumentoEmpresa> {
    return this.repository.subirDocumento(idEmpresa, datos);
  }

  listarRevision(): Promise<DocumentacionEmpresaResponse[]> {
    return this.repository.listarRevision();
  }

  subirFormato(datos: SubirFormatoEmpresaInput): Promise<FormatoEmpresa> {
    return this.repository.subirFormato(datos);
  }

  revisarDocumento(
    idDocumentoEmpresa: number,
    datos: RevisarDocumentoEmpresaInput,
  ): Promise<DocumentoEmpresa> {
    return this.repository.revisarDocumento(idDocumentoEmpresa, datos);
  }

  editarDocumento(
    idDocumentoEmpresa: number,
    datos: EditarDocumentoEmpresaInput,
  ): Promise<DocumentoEmpresa> {
    return this.repository.editarDocumento(idDocumentoEmpresa, datos);
  }

  configurarRequisito(
    idTipoDocumentoEmpresa: number,
    datos: ConfigurarRequisitoEmpresaInput,
  ) {
    return this.repository.configurarRequisito(idTipoDocumentoEmpresa, datos);
  }
}
