import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BookUser,
  Building2,
  CheckCircle2,
  Filter,
  GraduationCap,
  RotateCcw,
  Save,
  Search,
  UserCheck,
  Users,
} from "lucide-react";

import { gestionAsignacionAsesoresUseCase } from "../../dependencies";
import type {
  AsignacionParaAsesor,
  AsesorDisponible,
} from "../../../domain/coordinador/AsignacionAsesor";

import type { StatCard } from "../../../shared/types/ui";
export function AsignarAsesores() {
  const [asignaciones, setAsignaciones] = useState<AsignacionParaAsesor[]>([]);
  const [asesores, setAsesores] = useState<AsesorDisponible[]>([]);
  const [selecciones, setSelecciones] = useState<Record<number, number>>({});
  const [busqueda, setBusqueda] = useState("");
  const [estadoFiltro, setEstadoFiltro] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      setError("");
      const data = await gestionAsignacionAsesoresUseCase.listar();
      setAsignaciones(data.asignaciones);
      setAsesores(data.asesores);
      setSelecciones(
        Object.fromEntries(
          data.asignaciones
            .filter((asignacion) => asignacion.id_asesor)
            .map((asignacion) => [
              asignacion.id_asignacion,
              asignacion.id_asesor as number,
            ])
        )
      );
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las asignaciones.");
    } finally {
      setCargando(false);
    }
  }

  async function guardarAsesor(asignacion: AsignacionParaAsesor) {
    const idAsesor = selecciones[asignacion.id_asignacion];
    if (!idAsesor) return;

    try {
      setGuardando(asignacion.id_asignacion);
      await gestionAsignacionAsesoresUseCase.asignarAsesor(
        asignacion.id_asignacion,
        idAsesor
      );
      await cargarDatos();
    } catch (err) {
      console.error(err);
      alert("No se pudo asignar el asesor.");
    } finally {
      setGuardando(null);
    }
  }

  const filtradas = useMemo(() => {
    return asignaciones.filter((asignacion) => {
      const q = busqueda.toLowerCase();
      const coincideBusqueda =
        asignacion.alumno.toLowerCase().includes(q) ||
        (asignacion.matricula ?? "").toLowerCase().includes(q) ||
        asignacion.carrera.toLowerCase().includes(q) ||
        asignacion.empresa.toLowerCase().includes(q) ||
        asignacion.asesor.toLowerCase().includes(q);

      const coincideEstado =
        estadoFiltro === "todos" ||
        (estadoFiltro === "sin_asesor" && !asignacion.id_asesor) ||
        (estadoFiltro === "con_asesor" && Boolean(asignacion.id_asesor));

      return coincideBusqueda && coincideEstado;
    });
  }, [asignaciones, busqueda, estadoFiltro]);

  const resumen = {
    total: asignaciones.length,
    sinAsesor: asignaciones.filter((asignacion) => !asignacion.id_asesor).length,
    conAsesor: asignaciones.filter((asignacion) => asignacion.id_asesor).length,
    asesores: asesores.length,
  };

  function limpiarFiltros() {
    setBusqueda("");
    setEstadoFiltro("todos");
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Asignación de Asesores
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Asigna un asesor interno a los alumnos que ya cuentan con empresa y vacante.
        </p>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {([
          ["Asignaciones", resumen.total, Users],
          ["Sin asesor", resumen.sinAsesor, AlertTriangle],
          ["Con asesor", resumen.conAsesor, CheckCircle2],
          ["Asesores", resumen.asesores, BookUser],
        ] satisfies StatCard[]).map(([titulo, valor, Icon]) => (
          <div
            key={titulo}
            className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0d2b5e]">
                {cargando ? "..." : valor}
              </div>
              <div className="text-xs text-gray-500">{titulo}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e] text-sm">
              Filtros de asignación
            </h3>
          </div>

          <button
            onClick={limpiarFiltros}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1565c0]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="outline-none text-sm w-full"
              placeholder="Buscar alumno, matrícula, carrera, empresa o asesor..."
            />
          </div>

          <select
            value={estadoFiltro}
            onChange={(e) => setEstadoFiltro(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option value="todos">Todas las asignaciones</option>
            <option value="sin_asesor">Sin asesor</option>
            <option value="con_asesor">Con asesor</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">Alumnos con empresa asignada</h3>
          <span className="ml-auto text-xs text-gray-400">
            {filtradas.length} resultados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3">Alumno</th>
                <th className="px-6 py-3">Empresa / Vacante</th>
                <th className="px-6 py-3">Asesor actual</th>
                <th className="px-6 py-3">Asignar asesor</th>
                <th className="px-6 py-3">Acción</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {cargando && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    Cargando asignaciones...
                  </td>
                </tr>
              )}

              {!cargando &&
                filtradas.map((asignacion) => {
                  const idSeleccionado = selecciones[asignacion.id_asignacion] ?? "";
                  const cambioPendiente =
                    idSeleccionado && idSeleccionado !== asignacion.id_asesor;

                  return (
                    <tr key={asignacion.id_asignacion} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-[#0d2b5e]">
                          {asignacion.alumno}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {asignacion.matricula ?? "Sin matrícula"}
                        </div>
                        <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                          <GraduationCap className="w-3.5 h-3.5" />
                          {asignacion.carrera}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <div className="text-gray-700 flex items-center gap-1">
                          <Building2 className="w-3.5 h-3.5 text-gray-400" />
                          {asignacion.empresa}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {asignacion.vacante}
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            asignacion.id_asesor
                              ? "bg-green-100 text-green-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {asignacion.asesor}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <select
                          value={idSeleccionado}
                          onChange={(e) =>
                            setSelecciones((actual) => ({
                              ...actual,
                              [asignacion.id_asignacion]: Number(e.target.value),
                            }))
                          }
                          className="border rounded-xl px-3 py-2 text-sm bg-white min-w-64"
                        >
                          <option value="">Selecciona asesor</option>
                          {asesores.map((asesor) => (
                            <option key={asesor.id_asesor} value={asesor.id_asesor}>
                              {asesor.nombre} ({asesor.asignaciones_activas})
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="px-6 py-4">
                        <button
                          onClick={() => guardarAsesor(asignacion)}
                          disabled={!cambioPendiente || guardando === asignacion.id_asignacion}
                          className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Save className="w-4 h-4" />
                          {guardando === asignacion.id_asignacion ? "Guardando..." : "Guardar"}
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {!cargando && filtradas.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-400">
                    No se encontraron asignaciones con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
