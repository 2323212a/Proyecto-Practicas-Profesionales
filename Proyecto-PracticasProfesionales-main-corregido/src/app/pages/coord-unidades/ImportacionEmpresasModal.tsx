import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Eye,
  FileCheck2,
  FileSpreadsheet,
  LoaderCircle,
  Upload,
  X,
} from "lucide-react";

import type {
  FilaValidacionEmpresa,
  ResultadoImportacionEmpresas,
  ValidacionImportacionEmpresas,
} from "../../../domain/coord-unidades/ImportacionEmpresa";
import {
  confirmarImportacionEmpresas,
  descargarPlantillaEmpresas,
  descargarReporteImportacionEmpresas,
  validarImportacionEmpresas,
} from "../../../infrastructure/coord-unidades/importacionEmpresasApi";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

type Props = {
  abierto: boolean;
  onClose: () => void;
  onImported: () => void | Promise<void>;
};

function tamanoArchivo(bytes: number) {
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

function guardarBlob(blob: Blob, nombre: string) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombre;
  enlace.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function colorEstado(estado: string) {
  if (estado === "Válido") return "bg-green-100 text-green-700";
  if (estado === "Con advertencias") return "bg-yellow-100 text-yellow-800";
  return "bg-red-100 text-red-700";
}

export function ImportacionEmpresasModal({ abierto, onClose, onImported }: Props) {
  const [excel, setExcel] = useState<File | null>(null);
  const [validacion, setValidacion] = useState<ValidacionImportacionEmpresas | null>(null);
  const [resultado, setResultado] = useState<ResultadoImportacionEmpresas | null>(null);
  const [procesando, setProcesando] = useState<"plantilla" | "validar" | "confirmar" | "reporte" | null>(null);
  const [error, setError] = useState("");
  const [filaVista, setFilaVista] = useState<FilaValidacionEmpresa | null>(null);
  const [vistaRevisada, setVistaRevisada] = useState(false);

  if (!abierto) return null;

  function reiniciarValidacion(nuevoExcel: File | null) {
    setExcel(nuevoExcel);
    setValidacion(null);
    setResultado(null);
    setFilaVista(null);
    setVistaRevisada(false);
    setError("");
  }

  function cerrar() {
    if (procesando) return;
    setExcel(null);
    setValidacion(null);
    setResultado(null);
    setFilaVista(null);
    setVistaRevisada(false);
    setError("");
    onClose();
  }

  async function descargarPlantilla() {
    try {
      setProcesando("plantilla");
      setError("");
      guardarBlob(await descargarPlantillaEmpresas(), "Plantilla_Carga_Unidades_Receptoras.xlsx");
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo descargar la plantilla."));
    } finally {
      setProcesando(null);
    }
  }

  async function validar() {
    if (!excel) return;
    try {
      setProcesando("validar");
      setError("");
      setResultado(null);
      setFilaVista(null);
      setVistaRevisada(false);
      setValidacion(await validarImportacionEmpresas(excel));
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo validar la importación."));
    } finally {
      setProcesando(null);
    }
  }

  async function confirmar() {
    if (!validacion?.puede_confirmar || !vistaRevisada) return;
    if (!window.confirm("Se crearán " + validacion.resumen.validas + " empresas válidas. Las filas inválidas serán omitidas. ¿Deseas continuar?")) return;
    try {
      setProcesando("confirmar");
      setError("");
      const respuesta = await confirmarImportacionEmpresas(validacion.id_importacion);
      setResultado(respuesta);
      await onImported();
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo confirmar la importación."));
    } finally {
      setProcesando(null);
    }
  }

  async function descargarReporte() {
    if (!resultado) return;
    try {
      setProcesando("reporte");
      setError("");
      guardarBlob(
        await descargarReporteImportacionEmpresas(resultado.id_importacion),
        "Reporte_Importacion_Unidades_" + resultado.id_importacion.slice(0, 8) + ".xlsx",
      );
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo descargar el reporte."));
    } finally {
      setProcesando(null);
    }
  }

  const paso = resultado ? 4 : validacion ? 3 : excel ? 2 : 1;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-3 backdrop-blur-sm">
      <div className="flex max-h-[94vh] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl">
        <div className="flex items-start justify-between border-b border-gray-200 bg-[#0d2b5e] px-5 py-4 text-white">
          <div>
            <h2 className="text-lg font-bold">Carga masiva de unidades receptoras</h2>
            <p className="mt-1 text-xs text-blue-100">Valida la información y el enlace de documentos antes de guardar.</p>
          </div>
          <button onClick={cerrar} disabled={Boolean(procesando)} className="rounded-lg p-1.5 hover:bg-white/10 disabled:opacity-50" aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="border-b border-gray-100 px-5 py-3">
          <div className="grid grid-cols-4 gap-2">
            {["Plantilla", "Archivo", "Vista previa", "Resultado"].map((etiqueta, indice) => (
              <div key={etiqueta} className="flex items-center gap-2">
                <span className={"flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold " + (paso >= indice + 1 ? "bg-[#1565c0] text-white" : "bg-gray-100 text-gray-400")}>{indice + 1}</span>
                <span className={"hidden text-xs font-semibold sm:block " + (paso >= indice + 1 ? "text-[#0d2b5e]" : "text-gray-400")}>{etiqueta}</span>
              </div>
            ))}
          </div>
          {procesando && (
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-blue-100">
              <div className="h-full w-1/2 animate-pulse rounded-full bg-[#1565c0]" />
            </div>
          )}
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {error && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

          <section className="rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <FileSpreadsheet className="mt-0.5 h-6 w-6 text-[#1565c0]" />
                <div>
                  <h3 className="font-bold text-[#0d2b5e]">Plantilla oficial</h3>
                  <p className="mt-1 text-xs text-blue-700">Incluye catálogos, instrucciones, listas desplegables y una fila de ejemplo que no se importa.</p>
                </div>
              </div>
              <button onClick={descargarPlantilla} disabled={Boolean(procesando)} className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1565c0] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                {procesando === "plantilla" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                Descargar plantilla
              </button>
            </div>
          </section>

          {!resultado && (
            <label
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                reiniciarValidacion(event.dataTransfer.files[0] ?? null);
              }}
              className="block cursor-pointer rounded-2xl border-2 border-dashed border-blue-300 bg-white p-5 text-center transition-colors hover:bg-blue-50"
            >
              <FileSpreadsheet className="mx-auto h-8 w-8 text-[#1565c0]" />
              <div className="mt-2 font-bold text-[#0d2b5e]">Archivo Excel</div>
              <div className="mt-1 text-xs text-gray-500">Arrastra o selecciona un archivo .xlsx (máximo 5 MB)</div>
              <div className="mt-1 text-xs text-violet-700">Los documentos se registran mediante un enlace dentro del Excel; no es necesario cargar un ZIP.</div>
              <input type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" className="sr-only" onChange={(event) => reiniciarValidacion(event.target.files?.[0] ?? null)} />
              {excel && <div className="mt-3 rounded-lg bg-blue-100 px-3 py-2 text-xs font-semibold text-blue-800">{excel.name} · {tamanoArchivo(excel.size)}</div>}
            </label>
          )}

          {!resultado && (
            <div className="flex flex-wrap justify-end gap-2">
              {excel && <button onClick={() => reiniciarValidacion(null)} disabled={Boolean(procesando)} className="rounded-xl border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-600">Limpiar archivos</button>}
              <button onClick={validar} disabled={!excel || Boolean(procesando)} className="inline-flex items-center gap-2 rounded-xl bg-[#0d2b5e] px-5 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                {procesando === "validar" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <FileCheck2 className="h-4 w-4" />}
                Validar archivo
              </button>
            </div>
          )}

          {validacion && !resultado && (
            <section className="space-y-4">
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                <h3 className="font-bold text-[#0d2b5e]">Vista previa antes de importar</h3>
                <p className="mt-1 text-sm text-blue-700">
                  Revisa el resumen y usa “Ver datos” para consultar las 24 columnas de cada empresa.
                  Nada se guardará hasta que confirmes la importación.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {[
                  ["Total", validacion.resumen.total, "bg-blue-50 text-blue-700"],
                  ["Válidas", validacion.resumen.validas, "bg-green-50 text-green-700"],
                  ["Advertencias", validacion.resumen.con_advertencias, "bg-yellow-50 text-yellow-800"],
                  ["Inválidas", validacion.resumen.invalidas, "bg-red-50 text-red-700"],
                ].map(([etiqueta, valor, color]) => (
                  <div key={String(etiqueta)} className={"rounded-xl border p-3 " + color}>
                    <div className="text-xl font-bold">{valor}</div><div className="text-xs">{etiqueta}</div>
                  </div>
                ))}
              </div>

              {validacion.errores_generales.length > 0 && (
                <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                  <div className="mb-2 flex items-center gap-2 font-bold"><AlertTriangle className="h-4 w-4" />Errores generales</div>
                  <ul className="list-disc space-y-1 pl-5">{validacion.errores_generales.map((item) => <li key={item}>{item}</li>)}</ul>
                </div>
              )}

              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-[1150px] w-full text-xs">
                  <thead className="bg-gray-50 text-left text-gray-500">
                    <tr><th className="px-3 py-3">Fila</th><th>Empresa</th><th>RFC</th><th>Tipo</th><th>Municipio / Estado</th><th>Responsable</th><th>Capacidad</th><th>Validación</th><th>Detalle</th><th className="pr-3">Observaciones</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {validacion.filas.map((fila) => (
                      <tr key={fila.fila} className="align-top">
                        <td className="px-3 py-3 font-bold text-[#0d2b5e]">{fila.fila}</td>
                        <td className="py-3 font-semibold text-[#0d2b5e]">{fila.nombre}</td><td className="py-3">{fila.rfc}</td><td className="py-3">{fila.tipo_unidad}</td>
                        <td className="py-3">{fila.municipio}<br /><span className="text-gray-400">{fila.estado}</span></td><td className="py-3">{fila.responsable}</td><td className="py-3">{fila.capacidad}</td>
                        <td className="py-3"><span className={"rounded-full px-2 py-1 font-semibold " + colorEstado(fila.estatus_validacion)}>{fila.estatus_validacion}</span></td>
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => setFilaVista(fila)}
                            className="inline-flex items-center gap-1 rounded-lg border border-blue-200 px-2.5 py-1.5 font-semibold text-[#1565c0] hover:bg-blue-50"
                          >
                            <Eye className="h-3.5 w-3.5" />
                            Ver datos
                          </button>
                        </td>
                        <td className="max-w-[320px] py-3 pr-3">
                          {fila.errores.map((item) => <div key={item} className="mb-1 text-red-600">• {item}</div>)}
                          {fila.advertencias.map((item) => <div key={item} className="mb-1 text-yellow-700">• {item}</div>)}
                          {!fila.errores.length && !fila.advertencias.length && <span className="text-green-600">Sin observaciones</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {filaVista && (
                <div className="rounded-2xl border border-blue-200 bg-white shadow-sm">
                  <div className="flex items-start justify-between border-b border-blue-100 bg-blue-50 px-4 py-3">
                    <div>
                      <h4 className="font-bold text-[#0d2b5e]">Datos completos · fila {filaVista.fila}</h4>
                      <p className="text-xs text-blue-700">{filaVista.nombre}</p>
                    </div>
                    <button type="button" onClick={() => setFilaVista(null)} className="rounded-lg p-1 text-gray-500 hover:bg-white" aria-label="Cerrar detalle">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <dl className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(filaVista.datos).map(([campo, valor]) => (
                      <div key={campo} className="min-w-0 rounded-lg border border-gray-100 bg-gray-50 p-3">
                        <dt className="text-[11px] font-bold uppercase tracking-wide text-gray-500">{campo}</dt>
                        <dd className="mt-1 whitespace-pre-wrap break-words text-sm text-gray-800">{valor || "Sin dato"}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              )}

              <div className="flex flex-col items-end gap-3">
                <label className="flex max-w-xl cursor-pointer items-start gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={vistaRevisada}
                    onChange={(event) => setVistaRevisada(event.target.checked)}
                    className="mt-0.5 h-4 w-4 accent-[#1565c0]"
                  />
                  <span>He revisado la vista previa y confirmo que los datos válidos están listos para importarse.</span>
                </label>
                {!validacion.puede_confirmar && <p className="text-xs text-red-600">Corrige los errores generales o agrega al menos una fila válida antes de confirmar.</p>}
                {validacion.puede_confirmar && !vistaRevisada && <p className="text-xs text-amber-700">Marca la revisión de la vista previa para habilitar la confirmación.</p>}
                <button onClick={confirmar} disabled={!validacion.puede_confirmar || !vistaRevisada || Boolean(procesando)} className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40">
                  {procesando === "confirmar" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  Confirmar {validacion.resumen.validas} empresa(s)
                </button>
              </div>
            </section>
          )}

          {resultado && (
            <section className="space-y-4">
              <div className="rounded-2xl border border-green-200 bg-green-50 p-5">
                <div className="flex gap-3"><CheckCircle2 className="h-7 w-7 text-green-600" /><div><h3 className="font-bold text-green-800">Importación finalizada</h3><p className="mt-1 text-sm text-green-700">Las filas se procesaron de forma independiente y el reporte quedó disponible.</p></div></div>
              </div>
              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                {[
                  ["Leídas", resultado.resumen.total], ["Creadas", resultado.resumen.creadas], ["Omitidas", resultado.resumen.omitidas],
                  ["Advertencias", resultado.resumen.con_advertencias], ["Errores", resultado.resumen.con_errores],
                ].map(([etiqueta, valor]) => <div key={String(etiqueta)} className="rounded-xl border border-gray-200 p-3"><div className="text-xl font-bold text-[#0d2b5e]">{valor}</div><div className="text-xs text-gray-500">{etiqueta}</div></div>)}
              </div>
              <div className="overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-[800px] w-full text-xs"><thead className="bg-gray-50 text-left text-gray-500"><tr><th className="px-3 py-3">Fila</th><th>Empresa</th><th>RFC</th><th>Resultado</th><th>ID</th><th className="pr-3">Errores</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">{resultado.resultados.map((fila) => <tr key={fila.fila}><td className="px-3 py-3">{fila.fila}</td><td>{fila.nombre}</td><td>{fila.rfc}</td><td className="font-semibold">{fila.resultado}</td><td>{fila.id_empresa ?? fila.id_existente ?? "-"}</td><td className="pr-3 text-red-600">{fila.errores.join("; ") || "-"}</td></tr>)}</tbody>
                </table>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <button onClick={descargarReporte} disabled={Boolean(procesando)} className="inline-flex items-center gap-2 rounded-xl bg-[#1565c0] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {procesando === "reporte" ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}Descargar reporte
                </button>
                <button onClick={cerrar} className="rounded-xl border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-600">Cerrar</button>
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
