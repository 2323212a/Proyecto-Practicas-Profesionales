import type {
  DocumentacionEmpresaResponse,
  DocumentoEmpresa,
  EstadoDocumentoEmpresa,
  FormatoEmpresa,
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
    estado: EstadoDocumentoEmpresa,
    observaciones?: string,
  ): Promise<DocumentoEmpresa> {
    return this.repository.revisarDocumento(idDocumentoEmpresa, estado, observaciones);
  }
}
