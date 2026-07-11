import { useEffect, useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Send,
  Upload,
  X,
  XCircle,
} from "lucide-react";

import { gestionDocumentacionEmpresaUseCase } from "../../dependencies";
import type {
  DocumentacionEmpresaResponse,
  DocumentoEmpresa,
  EstadoDocumentoEmpresa,
  RequisitoEmpresa,
} from "../../../domain/empresa/DocumentacionEmpresa";

const estadoColor: Record<string, string> = {
  Activa: "bg-green-100 text-green-700",
  Pendiente: "bg-yellow-100 text-yellow-700",
  Suspendida: "bg-red-100 text-red-700",
  Inactiva: "bg-gray-100 text-gray-600",
};

function archivoABase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",", 2)[1] ?? "");
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function urlArchivo(url: string) {
  return `http://127.0.0.1:8000${url}`;
}

export function ExpedienteEmpresa() {
  const [empresas, setEmpresas] = useState<DocumentacionEmpresaResponse[]>([]);
  const [seleccionada, setSeleccionada] = useState<number | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [procesando, setProcesando] = useState<number | null>(null);
  const [rechazando, setRechazando] = useState<DocumentoEmpresa | null>(null);
  const [observaciones, setObservaciones] = useState("");
  const [formatoTipo, setFormatoTipo] = useState<number | null>(null);
  const [descripcionFormato, setDescripcionFormato] = useState("");

  useEffect(() => {
    void cargar();
  }, []);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const respuesta = await gestionDocumentacionEmpresaUseCase.listarRevision();
      setEmpresas(respuesta);
      setSeleccionada((actual) => actual ?? respuesta[0]?.empresa.id_empresa ?? null);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la documentacion empresarial.");
    } finally {
      setCargando(false);
    }
  }

  const empresaActual = useMemo(
    () => empresas.find((empresa) => empresa.empresa.id_empresa === seleccionada) ?? null,
    [empresas, seleccionada],
  );

  async function revisarDocumento(
    documento: DocumentoEmpresa,
    estado: EstadoDocumentoEmpresa,
    nota?: string,
  ) {
    try {
      setProcesando(documento.id_documento_empresa);
      setError("");
      await gestionDocumentacionEmpresaUseCase.revisarDocumento(
        documento.id_documento_empresa,
        estado,
        nota,
      );
      await cargar();
      setRechazando(null);
      setObservaciones("");
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar el documento.");
    } finally {
      setProcesando(null);
    }
  }

  async function subirFormato(requisito: RequisitoEmpresa, event: ChangeEvent<HTMLInputElement>) {
    const archivo = event.target.files?.[0];
    if (!archivo) return;

    try {
      setFormatoTipo(requisito.id_tipo_documento_empresa);
      setError("");
      const contenido = await archivoABase64(archivo);
      await gestionDocumentacionEmpresaUseCase.subirFormato({
        id_tipo_documento_empresa: requisito.id_tipo_documento_empresa,
        nombre_archivo: archivo.name,
        contenido_base64: contenido,
        mime_type: archivo.type || "application/pdf",
        descripcion: descripcionFormato || undefined,
      });
      setDescripcionFormato("");
      await cargar();
    } catch (err) {
      console.error(err);
      setError("No se pudo subir el formato. Revisa que sea un PDF valido.");
    } finally {
      setFormatoTipo(null);
      event.target.value = "";
    }
  }

  if (cargando) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-500">
        Cargando expedientes empresariales...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Expediente de Empresa</h1>
        <p className="text-gray-500 text-sm mt-1">
          Revision documental de unidades receptoras y publicacion de formatos institucionales.
        </p>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 lg:col-span-1">
          <h3 className="font-bold text-[#0d2b5e] mb-4">Empresas</h3>
          <div className="space-y-2">
            {empresas.map((empresa) => (
              <button
                key={empresa.empresa.id_empresa}
                onClick={() => setSeleccionada(empresa.empresa.id_empresa)}
                className={`w-full text-left border rounded-xl p-3 ${
                  seleccionada === empresa.empresa.id_empresa
                    ? "border-[#1565c0] bg-blue-50"
                    : "border-gray-200 hover:bg-gray-50"
                }`}
              >
                <div className="font-semibold text-sm text-[#0d2b5e]">{empresa.empresa.nombre_empresa}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {empresa.resumen.aprobados}/{empresa.resumen.total} documentos aprobados
                </div>
                <span
                  className={`inline-block mt-2 text-xs px-2.5 py-1 rounded-full font-semibold ${
                    estadoColor[empresa.empresa.estado_empresa] ?? "bg-gray-100 text-gray-600"
                  }`}
                >
                  {empresa.empresa.estado_empresa}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3 space-y-6">
          {empresaActual ? (
            <>
              <div className="bg-[#0d2b5e] text-white rounded-2xl p-6">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                  <div>
                    <h2 className="text-xl font-bold">{empresaActual.empresa.nombre_empresa}</h2>
                    <p className="text-blue-200 text-sm mt-1">
                      RFC: {empresaActual.empresa.rfc ?? "Sin RFC"} · {empresaActual.empresa.giro ?? "Sin giro"}
                    </p>
                  </div>

                  <span className="bg-white/15 text-white px-4 py-2 rounded-full text-sm font-semibold w-fit">
                    {empresaActual.empresa.estado_empresa}
                  </span>
                </div>

                <div className="grid md:grid-cols-4 gap-4 mt-6">
                  {[
                    ["Aprobados", empresaActual.resumen.aprobados, CheckCircle2],
                    ["Pendientes", empresaActual.resumen.pendientes, AlertTriangle],
                    ["Rechazados", empresaActual.resumen.rechazados, XCircle],
                    ["Faltantes", empresaActual.resumen.faltantes, FileText],
                  ].map(([label, value, Icon]: any) => (
                    <div key={label} className="bg-white/10 rounded-xl p-4">
                      <Icon className="w-5 h-5 text-blue-200 mb-2" />
                      <div className="font-bold">{value}</div>
                      <div className="text-blue-200 text-sm">{label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-bold text-[#0d2b5e] mb-5">Documentacion empresarial</h3>

                <div className="space-y-3">
                  {empresaActual.documentos.map((requisito) => {
                    const documento = requisito.documento;
                    const estado = documento?.estado_documento ?? "Faltante";

                    return (
                      <div
                        key={requisito.id_tipo_documento_empresa}
                        className="border border-gray-200 rounded-xl p-4"
                      >
                        <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <FileText className="w-5 h-5 text-[#1565c0] mt-0.5" />
                            <div>
                              <p className="font-medium text-gray-800">{requisito.nombre}</p>
                              <p className="text-xs text-gray-500 mt-1">
                                {documento?.nombre_archivo ?? "Sin documento cargado"}
                              </p>
                              <p className="text-xs text-[#1565c0] mt-1">
                                {requisito.requiere_formato
                                  ? requisito.formato
                                    ? "Con formato institucional"
                                    : "Requiere formato, pendiente de anexar"
                                  : "Sin formato institucional requerido"}
                              </p>
                              {documento?.observaciones && (
                                <p className="text-xs text-red-700 mt-2 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                                  Observaciones: {documento.observaciones}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold h-fit ${
                                estado === "Aprobado"
                                  ? "bg-green-100 text-green-700"
                                  : estado === "Pendiente"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : estado === "Rechazado"
                                      ? "bg-red-100 text-red-700"
                                      : "bg-gray-100 text-gray-600"
                              }`}
                            >
                              {estado}
                            </span>

                            <button
                              onClick={() => documento && window.open(urlArchivo(documento.url), "_blank")}
                              disabled={!documento}
                              className="border border-blue-200 text-[#1565c0] rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                            >
                              <Eye className="w-3 h-3" />
                              Ver
                            </button>

                            <button
                              onClick={() => requisito.formato && window.open(urlArchivo(requisito.formato.url), "_blank")}
                              disabled={!requisito.formato}
                              className="border border-gray-200 text-gray-600 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                            >
                              <Download className="w-3 h-3" />
                              {requisito.requiere_formato ? "Formato" : "Sin formato"}
                            </button>
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-2 mt-4">
                          <label className="border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 cursor-pointer">
                            <Upload className="w-4 h-4" />
                            {formatoTipo === requisito.id_tipo_documento_empresa
                              ? "Subiendo formato..."
                              : requisito.requiere_formato
                                ? "Actualizar formato"
                                : "Anexar formato"}
                            <input
                              type="file"
                              accept="application/pdf"
                              className="hidden"
                              onChange={(event) => subirFormato(requisito, event)}
                            />
                          </label>

                          {documento && documento.estado_documento !== "Aprobado" && (
                            <button
                              onClick={() => revisarDocumento(documento, "Aprobado")}
                              disabled={procesando === documento.id_documento_empresa}
                              className="bg-green-600 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              Aprobar
                            </button>
                          )}

                          {documento && documento.estado_documento !== "Rechazado" && (
                            <button
                              onClick={() => {
                                setRechazando(documento);
                                setObservaciones("");
                              }}
                              disabled={procesando === documento.id_documento_empresa}
                              className="border border-orange-200 text-orange-600 rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
                            >
                              <AlertTriangle className="w-4 h-4" />
                              Observar/Rechazar
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-400">
              No hay empresas registradas.
            </div>
          )}
        </div>
      </div>

      {rechazando && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 w-full max-w-xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#0d2b5e]">Rechazar documento</h3>
                <p className="text-sm text-gray-500 mt-1">
                  La empresa vera esta observacion para corregir el archivo.
                </p>
              </div>
              <button onClick={() => setRechazando(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <textarea
              value={observaciones}
              onChange={(event) => setObservaciones(event.target.value)}
              rows={4}
              placeholder="Indica que debe corregir la empresa..."
              className="mt-4 w-full border border-gray-300 rounded-xl px-3 py-2 text-sm outline-none resize-none focus:ring-2 focus:ring-orange-300"
            />

            <div className="flex flex-wrap gap-2 justify-end mt-4">
              <button
                onClick={() => setRechazando(null)}
                className="border border-gray-300 text-gray-600 rounded-xl px-4 py-2 text-xs font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => revisarDocumento(rechazando, "Rechazado", observaciones)}
                disabled={!observaciones.trim() || procesando === rechazando.id_documento_empresa}
                className="bg-orange-600 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                Enviar observacion
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
