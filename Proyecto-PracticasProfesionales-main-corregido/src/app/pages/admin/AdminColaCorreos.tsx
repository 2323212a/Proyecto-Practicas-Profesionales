import { useEffect, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  Loader2,
  Mail,
  RefreshCw,
  RotateCcw,
  Send,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import {
  type ColaCorreoDetalle,
  type ColaCorreoResumen,
  type EstadoColaCorreo,
  listarColaCorreos,
  obtenerDetalleColaCorreo,
  procesarColaCorreos,
  reintentarColaCorreo,
  reintentarColaCorreosMasivo,
} from "../../../infrastructure/admin/colaCorreosApi";

const estadoColor: Record<EstadoColaCorreo, string> = {
  PENDIENTE: "bg-yellow-100 text-yellow-700",
  ENVIADO: "bg-green-100 text-green-700",
  ERROR: "bg-red-100 text-red-700",
};

function formatearFecha(valor: string | null) {
  if (!valor) return "-";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "-";
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "medium", timeStyle: "short" }).format(fecha);
}

export function AdminColaCorreos() {
  const [items, setItems] = useState<ColaCorreoResumen[]>([]);
  const [detalle, setDetalle] = useState<ColaCorreoDetalle | null>(null);
  const [estado, setEstado] = useState<"TODOS" | EstadoColaCorreo>("TODOS");
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    void cargar();
  }, [estado]);

  async function cargar() {
    try {
      setLoading(true);
      setError("");
      const data = await listarColaCorreos({
        estado: estado === "TODOS" ? undefined : estado,
        limit: 200,
      });
      setItems(data.items);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la cola de correos.");
    } finally {
      setLoading(false);
    }
  }

  async function abrirDetalle(id: number) {
    try {
      setError("");
      setDetalle(await obtenerDetalleColaCorreo(id));
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el detalle del correo.");
    }
  }

  async function procesar() {
    try {
      setProcessing(true);
      setError("");
      setSuccess("");
      const resp = await procesarColaCorreos({ max_lote: 50, max_intentos: 3 });
      setSuccess(`Cola procesada. Registros procesados: ${resp.procesados}.`);
      await cargar();
    } catch (err) {
      console.error(err);
      setError("No se pudo procesar la cola.");
    } finally {
      setProcessing(false);
    }
  }

  async function reintentarUno(id: number) {
    try {
      setProcessing(true);
      setError("");
      setSuccess("");
      await reintentarColaCorreo(id);
      setSuccess(`Correo ${id} marcado para reintento.`);
      await cargar();
      if (detalle?.id === id) {
        setDetalle(await obtenerDetalleColaCorreo(id));
      }
    } catch (err) {
      console.error(err);
      setError("No se pudo marcar el correo para reintento.");
    } finally {
      setProcessing(false);
    }
  }

  async function reintentarMasivoErrores() {
    try {
      setProcessing(true);
      setError("");
      setSuccess("");
      const resp = await reintentarColaCorreosMasivo({ estado: "ERROR", limit: 500 });
      setSuccess(`Correos marcados para reintento: ${resp.total}.`);
      await cargar();
    } catch (err) {
      console.error(err);
      setError("No se pudo ejecutar el reintento masivo.");
    } finally {
      setProcessing(false);
    }
  }

  const resumen = {
    total: items.length,
    pendientes: items.filter((item) => item.estado === "PENDIENTE").length,
    enviados: items.filter((item) => item.estado === "ENVIADO").length,
    errores: items.filter((item) => item.estado === "ERROR").length,
  };

  const tarjetas: Array<{ label: string; value: number; icon: LucideIcon; color: string }> = [
    { label: "Total", value: resumen.total, icon: Mail, color: "bg-blue-50 text-blue-600" },
    { label: "Pendientes", value: resumen.pendientes, icon: Loader2, color: "bg-yellow-50 text-yellow-600" },
    { label: "Enviados", value: resumen.enviados, icon: CheckCircle2, color: "bg-green-50 text-green-600" },
    { label: "Errores", value: resumen.errores, icon: AlertTriangle, color: "bg-red-50 text-red-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Cola de Correos</h1>
        <p className="text-gray-500 text-sm mt-1">Monitorea envios de correo, revisa errores y reprocesa registros.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">{success}</div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {tarjetas.map((tarjeta) => {
          const Icon = tarjeta.icon;
          return (
            <div key={tarjeta.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className={`w-10 h-10 ${tarjeta.color} rounded-xl flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-[#0d2b5e]">{tarjeta.value}</div>
              <div className="text-gray-500 text-sm mt-0.5">{tarjeta.label}</div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <select
            value={estado}
            onChange={(event) => setEstado(event.target.value as "TODOS" | EstadoColaCorreo)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option value="TODOS">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="ENVIADO">Enviado</option>
            <option value="ERROR">Error</option>
          </select>
          <button
            onClick={() => void cargar()}
            disabled={loading}
            className="inline-flex items-center gap-2 border border-gray-200 rounded-xl px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => void procesar()}
            disabled={processing}
            className="inline-flex items-center gap-2 bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Procesar cola
          </button>
          <button
            onClick={() => void reintentarMasivoErrores()}
            disabled={processing || resumen.errores === 0}
            className="inline-flex items-center gap-2 border border-red-200 text-red-700 rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reintentar errores
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3">ID</th>
                <th className="text-left px-4 py-3">Destinatario</th>
                <th className="text-left px-4 py-3">Asunto</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-left px-4 py-3">Intentos</th>
                <th className="text-left px-4 py-3">Creado</th>
                <th className="text-left px-4 py-3">Error</th>
                <th className="text-left px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={8}>Cargando...</td>
                </tr>
              ) : items.length === 0 ? (
                <tr>
                  <td className="px-4 py-8 text-center text-gray-500" colSpan={8}>No hay correos en la cola para este filtro.</td>
                </tr>
              ) : (
                items.map((item) => (
                  <tr key={item.id} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="px-4 py-3 font-semibold text-[#0d2b5e]">#{item.id}</td>
                    <td className="px-4 py-3 text-gray-700">{item.destinatario}</td>
                    <td className="px-4 py-3 text-gray-700">{item.asunto}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full font-semibold ${estadoColor[item.estado]}`}>
                        {item.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{item.intentos}</td>
                    <td className="px-4 py-3 text-gray-700">{formatearFecha(item.fecha_creacion)}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[260px] truncate">{item.error_ultimo ?? "-"}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => void abrirDetalle(item.id)}
                          className="inline-flex items-center gap-1.5 border border-blue-200 text-[#1565c0] rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-blue-50"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Ver
                        </button>
                        <button
                          onClick={() => void reintentarUno(item.id)}
                          disabled={processing || item.estado === "ENVIADO"}
                          className="inline-flex items-center gap-1.5 border border-amber-200 text-amber-700 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-amber-50 disabled:opacity-50"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          Reintentar
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {detalle && (
        <div className="fixed inset-0 z-50 bg-black/50 flex justify-end" onClick={() => setDetalle(null)}>
          <div
            className="h-full w-full max-w-3xl bg-white shadow-xl overflow-y-auto"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 bg-white border-b border-gray-200 px-5 py-4 flex items-center justify-between">
              <h3 className="font-bold text-[#0d2b5e]">Detalle de correo #{detalle.id}</h3>
              <button onClick={() => setDetalle(null)} className="text-gray-500 hover:text-gray-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div><span className="font-semibold text-gray-700">Destinatario:</span> {detalle.destinatario}</div>
                <div><span className="font-semibold text-gray-700">Estado:</span> {detalle.estado}</div>
                <div className="md:col-span-2"><span className="font-semibold text-gray-700">Asunto:</span> {detalle.asunto}</div>
                <div><span className="font-semibold text-gray-700">Intentos:</span> {detalle.intentos}</div>
                <div><span className="font-semibold text-gray-700">Enviado:</span> {formatearFecha(detalle.fecha_envio)}</div>
              </div>

              {detalle.error_ultimo && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
                  {detalle.error_ultimo}
                </div>
              )}

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Contenido texto</h4>
                <pre className="bg-gray-50 border border-gray-200 rounded-xl p-3 text-xs whitespace-pre-wrap text-gray-700">
                  {detalle.contenido}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 mb-2">Vista HTML</h4>
                {detalle.contenido_html ? (
                  <iframe
                    title={`preview-html-${detalle.id}`}
                    sandbox="allow-same-origin"
                    className="w-full h-96 border border-gray-200 rounded-xl"
                    srcDoc={detalle.contenido_html}
                  />
                ) : (
                  <div className="text-sm text-gray-500">Sin contenido HTML.</div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
