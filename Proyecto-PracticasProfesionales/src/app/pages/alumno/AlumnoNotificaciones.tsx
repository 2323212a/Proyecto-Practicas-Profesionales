import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Bell, Check, CheckCircle, Eye, Info, X, XCircle } from "lucide-react";

import { apiClient } from "../../../infrastructure/api/apiClient";

type Tipo = "aprobado" | "rechazado" | "advertencia" | "info";

type Notificacion = {
  id_notificacion: number;
  tipo: Tipo;
  titulo: string;
  mensaje: string;
  fecha_envio: string;
  leida: boolean;
};

const tipoCfg: Record<Tipo, { icon: any; color: string; bg: string }> = {
  aprobado: { icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
  rechazado: { icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
  advertencia: { icon: AlertTriangle, color: "text-yellow-600", bg: "bg-yellow-50" },
  info: { icon: Info, color: "text-blue-600", bg: "bg-blue-50" },
};

const formatearFecha = (fecha?: string) => {
  if (!fecha) return "Sin fecha";
  return new Date(fecha).toLocaleString("es-MX", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
};

export function AlumnoNotificaciones() {
  const [notifs, setNotifs] = useState<Notificacion[]>([]);
  const [filtro, setFiltro] = useState<"todas" | "no_leidas">("todas");
  const [seleccionada, setSeleccionada] = useState<Notificacion | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarNotificaciones();
  }, []);

  const cargarNotificaciones = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await apiClient.get<Notificacion[]>("/notificaciones");
      setNotifs(response.data || []);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.detail || "No se pudieron cargar las notificaciones.");
    } finally {
      setLoading(false);
    }
  };

  const noLeidas = useMemo(() => notifs.filter((n) => !n.leida).length, [notifs]);
  const filtradas = filtro === "no_leidas" ? notifs.filter((n) => !n.leida) : notifs;

  const marcarComoLeida = async (id: number) => {
    try {
      await apiClient.patch(`/notificaciones/${id}/leer`);
      setNotifs((prev) => prev.map((n) => n.id_notificacion === id ? { ...n, leida: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const marcarTodas = async () => {
    try {
      await apiClient.patch("/notificaciones/leer-todas");
      setNotifs((prev) => prev.map((n) => ({ ...n, leida: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const abrirDetalle = (notificacion: Notificacion) => {
    setSeleccionada(notificacion);
    if (!notificacion.leida) marcarComoLeida(notificacion.id_notificacion);
  };

  if (loading) return <div className="text-sm text-gray-500">Cargando notificaciones...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">Notificaciones</h1>
          <p className="text-gray-500 text-sm mt-1">Avisos del coordinador, asesor academico y del sistema.</p>
        </div>
        {noLeidas > 0 && <button onClick={marcarTodas} className="flex items-center gap-2 text-sm text-[#1565c0] hover:underline"><Check className="w-4 h-4" />Marcar todas como leidas</button>}
      </div>

      {error ? <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div> : null}

      <div className="flex gap-3">
        <button onClick={() => setFiltro("todas")} className={`px-5 py-2 rounded-xl text-sm font-semibold ${filtro === "todas" ? "bg-[#0d2b5e] text-white" : "bg-white border border-gray-200 text-gray-600"}`}>Todas</button>
        <button onClick={() => setFiltro("no_leidas")} className={`px-5 py-2 rounded-xl text-sm font-semibold ${filtro === "no_leidas" ? "bg-[#0d2b5e] text-white" : "bg-white border border-gray-200 text-gray-600"}`}>No leidas ({noLeidas})</button>
      </div>

      <div className="space-y-3">
        {filtradas.map((n) => {
          const cfg = tipoCfg[n.tipo] || tipoCfg.info;
          const Icon = cfg.icon;
          return (
            <div key={n.id_notificacion} className={`bg-white rounded-2xl border shadow-sm p-5 flex gap-4 ${!n.leida ? "border-l-4 border-l-[#1565c0] border-gray-200" : "border-gray-200"}`}>
              <div className={`w-10 h-10 ${cfg.bg} rounded-xl flex items-center justify-center flex-shrink-0`}><Icon className={`w-5 h-5 ${cfg.color}`} /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2"><div className={`font-semibold text-sm ${!n.leida ? "text-[#0d2b5e]" : "text-gray-800"}`}>{n.titulo}</div>{!n.leida && <span className="bg-[#1565c0] w-2 h-2 rounded-full flex-shrink-0 mt-1" />}</div>
                <div className="text-gray-600 text-xs mt-1 leading-relaxed">{n.mensaje}</div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                  <div className="text-xs text-gray-400 flex items-center gap-1.5"><Bell className="w-3 h-3" />{formatearFecha(n.fecha_envio)}</div>
                  <div className="flex gap-3"><button onClick={() => abrirDetalle(n)} className="text-xs text-[#1565c0] hover:underline flex items-center gap-1"><Eye className="w-3 h-3" />Ver detalle</button>{!n.leida && <button onClick={() => marcarComoLeida(n.id_notificacion)} className="text-xs text-[#1565c0] hover:underline">Marcar como leida</button>}</div>
                </div>
              </div>
            </div>
          );
        })}
        {filtradas.length === 0 && <div className="text-center py-16 text-gray-400"><Bell className="w-12 h-12 mx-auto mb-3 opacity-30" /><div>No hay notificaciones{filtro === "no_leidas" ? " sin leer" : ""}</div></div>}
      </div>

      {seleccionada && <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"><div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-6"><div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4"><div><h2 className="text-xl font-bold text-[#0d2b5e]">Detalle de notificacion</h2><p className="text-sm text-gray-500 mt-1">Informacion completa del aviso recibido</p></div><button onClick={() => setSeleccionada(null)} className="text-gray-400 hover:text-gray-600"><X className="w-6 h-6" /></button></div><div className="mt-5 space-y-5"><div className="bg-gray-50 border border-gray-200 rounded-2xl p-4"><div className="text-xs text-gray-400 mb-1">Titulo</div><div className="font-bold text-[#0d2b5e]">{seleccionada.titulo}</div></div><div className="bg-gray-50 border border-gray-200 rounded-2xl p-4"><div className="text-xs text-gray-400 mb-1">Fecha</div><div className="text-sm font-semibold text-gray-700">{formatearFecha(seleccionada.fecha_envio)}</div></div><div className="bg-blue-50 border border-blue-200 rounded-2xl p-5"><div className="text-xs text-[#1565c0] font-semibold mb-2">Mensaje</div><p className="text-sm text-[#0d2b5e] leading-relaxed whitespace-pre-line">{seleccionada.mensaje}</p></div></div></div></div>}
    </div>
  );
}