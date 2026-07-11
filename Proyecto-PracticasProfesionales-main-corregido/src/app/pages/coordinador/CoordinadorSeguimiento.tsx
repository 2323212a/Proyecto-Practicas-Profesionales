import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { AlertTriangle, CheckCircle2, Clock, MessageSquare, Search, Send } from "lucide-react";
import { gestionSeguimientoPracticasUseCase } from "../../dependencies";
import type { EstadoIncidencia, IncidenciaPractica, IncidenciasCoordinadorResponse } from "../../../domain/seguimiento/SeguimientoPracticas";

import type { ColoredStatCard } from "../../../shared/types/ui";
const estadoColor: Record<string, string> = {
  Abierta: "bg-red-100 text-red-700",
  "En seguimiento": "bg-yellow-100 text-yellow-700",
  Resuelta: "bg-green-100 text-green-700",
  Cerrada: "bg-gray-100 text-gray-600",
};

export function CoordinadorSeguimiento() {
  const [datos, setDatos] = useState<IncidenciasCoordinadorResponse | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoIncidencia | "Todos">("Todos");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(true);
  const [seleccionada, setSeleccionada] = useState<IncidenciaPractica | null>(null);
  const [nuevoEstado, setNuevoEstado] = useState<EstadoIncidencia>("En seguimiento");
  const [respuesta, setRespuesta] = useState("");

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      setDatos(await gestionSeguimientoPracticasUseCase.listarIncidenciasCoordinador());
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las incidencias.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return (datos?.incidencias ?? []).filter((item) => {
      const texto = [item.alumno, item.matricula ?? "", item.empresa, item.tipo_incidencia, item.descripcion, item.reportante].join(" ").toLowerCase();
      return texto.includes(q) && (estado === "Todos" || item.estado === estado);
    });
  }, [busqueda, datos, estado]);

  async function actualizar(event: FormEvent) {
    event.preventDefault();
    if (!seleccionada) return;
    try {
      await gestionSeguimientoPracticasUseCase.actualizarIncidencia(seleccionada.id_incidencia, nuevoEstado, respuesta || undefined);
      setSeleccionada(null);
      setRespuesta("");
      await cargar();
    } catch (err) {
      console.error(err);
      setError("No se pudo actualizar la incidencia.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Seguimiento e Incidencias</h1>
        <p className="text-gray-500 text-sm mt-1">Atiende quejas e incidencias registradas por alumnos o unidades receptoras durante las practicas.</p>
      </div>
      {error && <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">{error}</div>}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {([
          ["Total", datos?.resumen.total ?? 0, MessageSquare, "bg-blue-50 text-blue-600"],
          ["Abiertas", datos?.resumen.abiertas ?? 0, AlertTriangle, "bg-red-50 text-red-600"],
          ["Seguimiento", datos?.resumen.seguimiento ?? 0, Clock, "bg-yellow-50 text-yellow-600"],
          ["Resueltas", datos?.resumen.resueltas ?? 0, CheckCircle2, "bg-green-50 text-green-600"],
        ] satisfies ColoredStatCard[]).map(([label, value, Icon, color]) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}><Icon className="w-5 h-5" /></div>
            <div className="text-2xl font-bold text-[#0d2b5e]">{value}</div>
            <div className="text-gray-500 text-sm mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="outline-none text-sm w-full" placeholder="Buscar alumno, empresa o detalle..." />
          </div>
          <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoIncidencia | "Todos")} className="border rounded-xl px-3 py-2 text-sm bg-white">
            <option>Todos</option>
            <option>Abierta</option>
            <option>En seguimiento</option>
            <option>Resuelta</option>
            <option>Cerrada</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="divide-y divide-gray-100">
          {cargando && <div className="p-10 text-center text-gray-400">Cargando incidencias...</div>}
          {!cargando && filtradas.map((item) => (
            <div key={item.id_incidencia} className="p-5 hover:bg-gray-50">
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#0d2b5e]">{item.tipo_incidencia}</h3>
                  <p className="text-sm text-gray-500 mt-1">{item.alumno} · {item.empresa}</p>
                  <p className="text-xs text-gray-400 mt-1">Reporta: {item.reportante} · Prioridad {item.prioridad}</p>
                  <p className="text-sm text-gray-700 mt-3">{item.descripcion}</p>
                  {item.respuesta_coordinacion && <p className="text-sm text-green-700 mt-3">Respuesta: {item.respuesta_coordinacion}</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoColor[item.estado]}`}>{item.estado}</span>
                  <button onClick={() => { setSeleccionada(item); setNuevoEstado(item.estado === "Abierta" ? "En seguimiento" : item.estado); setRespuesta(item.respuesta_coordinacion ?? ""); }} className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-xs font-semibold">Atender</button>
                </div>
              </div>
            </div>
          ))}
          {!cargando && filtradas.length === 0 && <div className="p-10 text-center text-gray-400">No hay incidencias con los filtros seleccionados.</div>}
        </div>
      </div>

      {seleccionada && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center p-4 z-50">
          <form onSubmit={actualizar} className="bg-white rounded-2xl p-6 w-full max-w-xl">
            <h3 className="font-bold text-[#0d2b5e]">Atender incidencia</h3>
            <p className="text-sm text-gray-500 mt-1">{seleccionada.tipo_incidencia} · {seleccionada.alumno}</p>
            <select value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value as EstadoIncidencia)} className="mt-4 w-full border rounded-xl px-3 py-2 text-sm bg-white">
              <option>Abierta</option>
              <option>En seguimiento</option>
              <option>Resuelta</option>
              <option>Cerrada</option>
            </select>
            <textarea value={respuesta} onChange={(e) => setRespuesta(e.target.value)} rows={5} className="mt-4 w-full border rounded-xl p-3 text-sm" placeholder="Respuesta o seguimiento de coordinacion..." />
            <div className="flex justify-end gap-3 mt-5">
              <button type="button" onClick={() => setSeleccionada(null)} className="border rounded-xl px-4 py-2 text-sm">Cancelar</button>
              <button className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm flex items-center gap-2"><Send className="w-4 h-4" /> Guardar</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
