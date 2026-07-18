import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Filter,
  RotateCcw,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router";

import { gestionVacantesRevisionUseCase } from "../../dependencies";
import type { VacanteRevision } from "../../../domain/coord-unidades/VacanteRevision";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

import type { StatCard } from "../../../shared/types/ui";
const estadoColor: Record<string, string> = {
  Pendiente: "bg-orange-100 text-orange-700",
  "Con observaciones": "bg-yellow-100 text-yellow-700",
  PrePadron: "bg-blue-100 text-blue-700",
  Activa: "bg-green-100 text-green-700",
  Rechazada: "bg-red-100 text-red-700",
  Cerrada: "bg-gray-100 text-gray-600",
};

export function GestionVacantes() {
  const navigate = useNavigate();
  const [vacantes, setVacantes] = useState<VacanteRevision[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [convocatoria, setConvocatoria] = useState("Todas");
  const [estado, setEstado] = useState("Todos");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarVacantes();
  }, []);

  async function cargarVacantes() {
    try {
      setCargando(true);
      setError("");
      const data = await gestionVacantesRevisionUseCase.listar();
      setVacantes(data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las vacantes.");
    } finally {
      setCargando(false);
    }
  }

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return vacantes.filter((vacante) => {
      const coincideBusqueda =
        vacante.empresa.toLowerCase().includes(q) ||
        vacante.titulo.toLowerCase().includes(q) ||
        (vacante.convocatoria ?? "").toLowerCase().includes(q) ||
        (vacante.tipo_practica ?? "").toLowerCase().includes(q);
      const coincideConvocatoria = convocatoria === "Todas" || String(vacante.id_convocatoria) === convocatoria;
      const coincideEstado = estado === "Todos" || vacante.estado_vacante === estado;
      return coincideBusqueda && coincideConvocatoria && coincideEstado;
    });
  }, [vacantes, busqueda, convocatoria, estado]);

  const convocatorias = useMemo(
    () =>
      Array.from(
        new Map(
          vacantes.map((vacante) => [
            vacante.id_convocatoria,
            vacante.convocatoria ?? `Convocatoria ${vacante.id_convocatoria}`,
          ]),
        ),
      ),
    [vacantes],
  );

  const resumen = {
    total: vacantes.length,
    pendientes: vacantes.filter((vacante) => vacante.estado_vacante === "Pendiente").length,
    prepadron: vacantes.filter((vacante) => vacante.estado_vacante === "PrePadron").length,
    activas: vacantes.filter((vacante) => vacante.estado_vacante === "Activa").length,
    cerradas: vacantes.filter((vacante) => vacante.estado_vacante === "Cerrada").length,
    publicables: vacantes.filter((vacante) => vacante.publicable).length,
    ocupados: vacantes.reduce((total, vacante) => total + vacante.cupo_ocupado, 0),
  };

  function limpiarFiltros() {
    setBusqueda("");
    setConvocatoria("Todas");
    setEstado("Todos");
  }

  async function cambiarEstado(vacante: VacanteRevision, nuevoEstado: string) {
    const requiereObservacion = ["Con observaciones", "Rechazada"].includes(nuevoEstado);
    const observaciones = requiereObservacion ? window.prompt("Observaciones") : undefined;
    if (requiereObservacion && !observaciones?.trim()) {
      return;
    }
    try {
      setGuardando(vacante.id_vacante);
      await gestionVacantesRevisionUseCase.cambiarEstado(vacante.id_vacante, nuevoEstado, observaciones?.trim());
      await cargarVacantes();
    } catch (err: unknown) {
      console.error(err);
      alert(getApiErrorMessage(err, "No se pudo actualizar la vacante."));
    } finally {
      setGuardando(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Revision de Vacantes</h1>
        <p className="text-gray-500 text-sm mt-1">
          Revisa vacantes pendientes y envialas a pre-padron. La liberacion final se realiza en Padron Empresarial.
        </p>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {([
          ["Vacantes", resumen.total, Briefcase],
          ["Pendientes", resumen.pendientes, Clock],
          ["Pre-padron", resumen.prepadron, CheckCircle2],
          ["Publicables", resumen.publicables, Users],
        ] satisfies StatCard[]).map(([label, value, Icon]) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0d2b5e]">{cargando ? "..." : value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e] text-sm">Filtros</h3>
          </div>
          <button onClick={limpiarFiltros} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1565c0]">
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        </div>

        <div className="grid md:grid-cols-[1fr_180px_180px] gap-4">
          <label className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              className="outline-none text-sm w-full"
              placeholder="Buscar empresa, vacante, convocatoria o tipo..."
            />
          </label>

          <select value={convocatoria} onChange={(event) => setConvocatoria(event.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white">
            <option value="Todas">Todas las convocatorias</option>
            {convocatorias.map(([id, nombre]) => (
              <option key={id} value={String(id)}>
                {nombre}
              </option>
            ))}
          </select>

          <select value={estado} onChange={(event) => setEstado(event.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white">
            <option>Todos</option>
            <option>Pendiente</option>
            <option>Con observaciones</option>
            <option>PrePadron</option>
            <option>Activa</option>
            <option>Rechazada</option>
            <option>Cerrada</option>
          </select>
        </div>
      </div>

      {cargando ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-sm text-gray-500">
          Cargando vacantes...
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-400">
          No hay vacantes que coincidan con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid xl:grid-cols-3 gap-5">
          {filtradas.map((vacante) => (
            <div key={vacante.id_vacante} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#0d2b5e]">{vacante.empresa}</h3>
                  <p className="text-sm text-gray-500 mt-1">{vacante.titulo}</p>
                  <p className="text-xs text-gray-400 mt-1">{vacante.convocatoria ?? "Sin convocatoria"}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoColor[vacante.estado_vacante] ?? "bg-gray-100 text-gray-600"}`}>
                  {vacante.estado_vacante}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="border rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-4 h-4" />
                    Cupo
                  </div>
                  <p className="font-bold text-[#0d2b5e] mt-1">
                    {vacante.cupos}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {vacante.cupo_ocupado} ocupado(s) por alumnos
                  </p>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CalendarDays className="w-4 h-4" />
                    Convocatoria
                  </div>
                  <p className="font-bold text-[#0d2b5e] mt-1">{vacante.convocatoria ?? "Sin convocatoria"}</p>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-xs text-gray-500">Periodo</div>
                  <p className="font-bold text-[#0d2b5e] mt-1">{vacante.periodo ?? "Sin periodo"}</p>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-xs text-gray-500">Tipo practica</div>
                  <p className="font-bold text-[#0d2b5e] mt-1">{vacante.tipo_practica ?? "Sin tipo"}</p>
                </div>
              </div>

              <div className="mt-4 border rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Building2 className="w-4 h-4" />
                  Empresa
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${vacante.estado_empresa === "Activa" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {vacante.estado_empresa}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${vacante.publicable ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {vacante.publicable ? "Visible en padron" : "No publicable"}
                  </span>
                </div>
              </div>

              {vacante.descripcion && (
                <div className="mt-4 bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                  {vacante.descripcion}
                </div>
              )}

              {(vacante.actividades || vacante.requisitos) && (
                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  {vacante.actividades && (
                    <div className="border rounded-xl p-4 text-sm text-gray-600">
                      <div className="text-xs font-semibold text-gray-500 mb-1">Actividades</div>
                      {vacante.actividades}
                    </div>
                  )}
                  {vacante.requisitos && (
                    <div className="border rounded-xl p-4 text-sm text-gray-600">
                      <div className="text-xs font-semibold text-gray-500 mb-1">Requisitos</div>
                      {vacante.requisitos}
                    </div>
                  )}
                </div>
              )}

              {vacante.observaciones && (
                <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm text-yellow-700">
                  {vacante.observaciones}
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-5">
                {vacante.estado_vacante === "Pendiente" && (
                  <>
                    <button
                      onClick={() => cambiarEstado(vacante, "PrePadron")}
                      disabled={guardando === vacante.id_vacante}
                      className="bg-green-600 text-white rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Aprobar a pre-padron
                    </button>
                    <button
                      onClick={() => cambiarEstado(vacante, "Con observaciones")}
                      disabled={guardando === vacante.id_vacante}
                      className="border border-yellow-200 text-yellow-700 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      Observaciones
                    </button>
                    <button
                      onClick={() => cambiarEstado(vacante, "Rechazada")}
                      disabled={guardando === vacante.id_vacante}
                      className="border border-red-200 text-red-600 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </>
                )}
                {vacante.estado_vacante === "PrePadron" && (
                  <button
                    onClick={() => cambiarEstado(vacante, "Con observaciones")}
                    disabled={guardando === vacante.id_vacante}
                    className="border border-yellow-200 text-yellow-700 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    Regresar a observaciones
                  </button>
                )}
                {vacante.estado_vacante === "Activa" && (
                  <button
                    onClick={() => cambiarEstado(vacante, "Cerrada")}
                    disabled={guardando === vacante.id_vacante}
                    className="border border-red-200 text-red-600 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    <XCircle className="w-3 h-3" />
                    Cerrar vacante
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#1565c0] mt-0.5" />
        <p className="text-sm text-[#0d2b5e]">
          Las vacantes aprobadas pasan a pre-padron. No seran visibles para alumnos hasta que Coordinacion libere el padron.
          Los cupos ocupados corresponden a asignaciones activas de alumnos.
        </p>
        <button onClick={() => navigate("/coord-unidades/padron")} className="ml-auto bg-[#1565c0] text-white rounded-xl px-4 py-2 text-xs font-semibold">
          Ir a Padron Empresarial
        </button>
      </div>
    </div>
  );
}
