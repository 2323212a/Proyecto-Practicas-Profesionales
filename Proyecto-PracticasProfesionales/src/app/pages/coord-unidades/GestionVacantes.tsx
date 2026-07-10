import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Filter,
  RotateCcw,
  Search,
  XCircle,
  Mail,
  FileText,
} from "lucide-react";
import {
  listarSolicitudes,
  aprobarSolicitud,
  rechazarSolicitud,
  type SolicitudUnidadListado,
} from "../../../infrastructure/coord-unidades/coordUnidadesApi";

const estadoColor: Record<string, string> = {
  Aprobada: "bg-green-100 text-green-700",
  Pendiente: "bg-yellow-100 text-yellow-700",
  "En Revision": "bg-blue-100 text-blue-700",
  Rechazada: "bg-red-100 text-red-700",
};

export function GestionVacantes() {
  const [solicitudes, setSolicitudes] = useState<SolicitudUnidadListado[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [procesandoId, setProcessandoId] = useState<number | null>(null);

  // Modal state
  const [modalAprobar, setModalAprobar] = useState<number | null>(null);
  const [modalRechazar, setModalRechazar] = useState<number | null>(null);
  const [rechazoForm, setRechazoForm] = useState({ motivo_rechazo: "", observaciones: "" });

  const cargarSolicitudes = async () => {
    try {
      setCargando(true);
      setError(null);
      const estadoFiltro = estado === "Todos" ? undefined : estado;
      const data = await listarSolicitudes(estadoFiltro, undefined, undefined);
      setSolicitudes(data || []);
    } catch {
      setError("No se pudieron cargar las solicitudes.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    cargarSolicitudes();
  }, [estado]);

  const filtradas = useMemo(() => {
    return solicitudes.filter((s) => {
      const texto = `${s.nombre_empresa || ""} ${s.rfc || ""}`.toLowerCase();
      const coincideBusqueda = texto.includes(busqueda.toLowerCase());
      return coincideBusqueda;
    });
  }, [busqueda, solicitudes]);

  const resumen = {
    total: solicitudes.length,
    aprobadas: solicitudes.filter((s) => s.estado === "Aprobada").length,
    pendientes: solicitudes.filter((s) => s.estado === "Pendiente").length,
    rechazadas: solicitudes.filter((s) => s.estado === "Rechazada").length,
  };

  const limpiarFiltros = () => {
    setBusqueda("");
    setEstado("Todos");
  };

  const handleAprobar = async (idSolicitud: number) => {
    try {
      setProcessandoId(idSolicitud);
      setError(null);
      await aprobarSolicitud(idSolicitud);
      setModalAprobar(null);
      await cargarSolicitudes();
    } catch {
      setError("No se pudo aprobar la solicitud.");
    } finally {
      setProcessandoId(null);
    }
  };

  const handleRechazar = async (idSolicitud: number) => {
    if (!rechazoForm.motivo_rechazo.trim()) {
      setError("El motivo del rechazo es obligatorio.");
      return;
    }

    try {
      setProcessandoId(idSolicitud);
      setError(null);
      await rechazarSolicitud(idSolicitud, rechazoForm);
      setModalRechazar(null);
      setRechazoForm({ motivo_rechazo: "", observaciones: "" });
      await cargarSolicitudes();
    } catch {
      setError("No se pudo rechazar la solicitud.");
    } finally {
      setProcessandoId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Solicitudes de Unidades Receptoras</h1>
        <p className="text-gray-500 text-sm mt-1">
          Revisión y gestión de solicitudes de registro de nuevas unidades receptoras de prácticas profesionales
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          ["Solicitudes", resumen.total, Building2],
          ["Aprobadas", resumen.aprobadas, CheckCircle2],
          ["Pendientes", resumen.pendientes, Clock],
          ["Rechazadas", resumen.rechazadas, XCircle],
        ].map(([label, value, Icon]: any) => (
          <div
            key={label}
            className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0d2b5e]">{value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e] text-sm">Filtros de búsqueda</h3>
          </div>

          <button
            onClick={limpiarFiltros}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1565c0]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="outline-none text-sm w-full"
              placeholder="Buscar por nombre de empresa o RFC..."
            />
          </div>

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Todos</option>
            <option>Pendiente</option>
            <option>En Revision</option>
            <option>Aprobada</option>
            <option>Rechazada</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          {error}
        </div>
      )}

      {cargando && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-400">
          Cargando solicitudes...
        </div>
      )}

      {!cargando && filtradas.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-400">
          No hay solicitudes que coincidan con los filtros seleccionados.
        </div>
      )}

      {!cargando && filtradas.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Empresa</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">RFC</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Giro</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Correo</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Teléfono</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Estado</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Fecha Solicitud</th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtradas.map((s) => (
                  <tr key={s.id_solicitud} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <p className="font-medium text-[#0d2b5e]">{s.nombre_empresa}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{s.rfc}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{s.giro}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600 flex items-center gap-1">
                        <Mail className="w-3.5 h-3.5 text-gray-400" />
                        {s.correo_contacto || "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">{s.telefono || "—"}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                          estadoColor[s.estado] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {s.estado}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-gray-600">
                        {s.fecha_solicitud
                          ? new Date(s.fecha_solicitud).toLocaleDateString("es-MX")
                          : "—"}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {s.estado !== "Aprobada" && s.estado !== "Rechazada" && (
                          <>
                            <button
                              onClick={() => setModalAprobar(s.id_solicitud)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-green-700 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Aprobar
                            </button>
                            <button
                              onClick={() => setModalRechazar(s.id_solicitud)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors"
                            >
                              <XCircle className="w-3 h-3" />
                              Rechazar
                            </button>
                          </>
                        )}
                        {(s.estado === "Aprobada" || s.estado === "Rechazada") && (
                          <span className="text-xs text-gray-500">Sin acciones</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Aprobar */}
      {modalAprobar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="bg-[#0d2b5e] px-6 py-4 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white">Confirmar Aprobación</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-gray-700 text-sm">
                ¿Deseas aprobar esta solicitud de unidad receptora? La empresa podrá acceder al sistema tras la aprobación.
              </p>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => setModalAprobar(null)}
                className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAprobar(modalAprobar)}
                disabled={procesandoId !== null}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-semibold disabled:bg-gray-400"
              >
                {procesandoId !== null ? "Aprobando..." : "Aceptar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Rechazar */}
      {modalRechazar && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="bg-[#0d2b5e] px-6 py-4 flex items-center gap-3">
              <XCircle className="w-5 h-5 text-white" />
              <h3 className="font-bold text-white">Rechazar Solicitud</h3>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Motivo del Rechazo *
                </label>
                <input
                  type="text"
                  value={rechazoForm.motivo_rechazo}
                  onChange={(e) =>
                    setRechazoForm({ ...rechazoForm, motivo_rechazo: e.target.value })
                  }
                  placeholder="Ej: Documentación incompleta"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1565c0]"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Observaciones
                </label>
                <textarea
                  value={rechazoForm.observaciones}
                  onChange={(e) =>
                    setRechazoForm({ ...rechazoForm, observaciones: e.target.value })
                  }
                  placeholder="Detalles adicionales..."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-[#1565c0] resize-none"
                />
              </div>
            </div>
            <div className="border-t border-gray-200 px-6 py-4 flex gap-3 justify-end">
              <button
                onClick={() => {
                  setModalRechazar(null);
                  setRechazoForm({ motivo_rechazo: "", observaciones: "" });
                }}
                className="px-4 py-2 text-gray-700 border border-gray-200 rounded-lg hover:bg-gray-50 text-sm font-semibold"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleRechazar(modalRechazar)}
                disabled={procesandoId !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-semibold disabled:bg-gray-400"
              >
                {procesandoId !== null ? "Rechazando..." : "Confirmar Rechazo"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
