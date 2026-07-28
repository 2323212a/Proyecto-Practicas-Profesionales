import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock,
  FileCheck,
  Filter,
  GraduationCap,
  RotateCcw,
  Search,
  Users,
} from "lucide-react";

import type { AlumnoGestionCoordinador } from "../../../domain/coordinador/CoordinadorGestion";
import { listarAlumnosGestionCoordinador } from "../../../infrastructure/coordinador/coordinadorGestionApi";

function estadoColor(estado: string) {
  const normalizado = estado.toLowerCase();

  if (normalizado.includes("observacion")) {
    return "bg-orange-100 text-orange-700";
  }

  if (normalizado.includes("revisión")) {
    return "bg-yellow-100 text-yellow-700";
  }

  if (normalizado.includes("aprobado") || normalizado.includes("asignado")) {
    return "bg-green-100 text-green-700";
  }

  return "bg-gray-100 text-gray-600";
}

function rutaDocumentosAlumno(alumno: AlumnoGestionCoordinador) {
  return `/coordinador/documentos?alumno=${alumno.id_alumno}`;
}

export function GestionAlumnos() {
  const navigate = useNavigate();
  const [alumnos, setAlumnos] = useState<AlumnoGestionCoordinador[]>([]);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("todos");
  const [carrera, setCarrera] = useState("todas");
  const [empresa, setEmpresa] = useState("todas");
  const [asesor, setAsesor] = useState("todos");
  const [fase, setFase] = useState("todas");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void cargarAlumnos();
  }, []);

  async function cargarAlumnos() {
    try {
      setCargando(true);
      setError("");
      setAlumnos(await listarAlumnosGestionCoordinador());
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la gestion de alumnos.");
    } finally {
      setCargando(false);
    }
  }

  const carreras = useMemo(
    () => [...new Set(alumnos.map((a) => a.carrera).filter(Boolean))],
    [alumnos],
  );
  const empresas = useMemo(
    () => [...new Set(alumnos.map((a) => a.empresa).filter(Boolean))],
    [alumnos],
  );
  const asesores = useMemo(
    () => [...new Set(alumnos.map((a) => a.asesor).filter(Boolean))],
    [alumnos],
  );
  const fases = useMemo(
    () => [...new Set(alumnos.map((a) => a.fase).filter(Boolean))],
    [alumnos],
  );

  const conteo = useMemo(
    () => ({
      total: alumnos.length,
      listos: alumnos.filter((a) => a.inicial_aprobado).length,
      enRevision: alumnos.filter((a) =>
        a.estado_documental.toLowerCase().includes("revisión"),
      ).length,
      observados: alumnos.filter((a) =>
        a.estado_documental.toLowerCase().includes("observacion"),
      ).length,
      asignados: alumnos.filter((a) =>
        a.estado_documental.toLowerCase().includes("asignado"),
      ).length,
    }),
    [alumnos],
  );

  const filtrados = useMemo(() => {
    return alumnos
      .filter((a) => {
        const busqueda = q.trim().toLowerCase();
        const coincideBusqueda =
          !busqueda ||
          [
            a.nombre,
            a.matricula,
            a.carrera,
            a.empresa,
            a.asesor,
            a.fase,
            a.siguiente_paso,
          ].some((valor) => valor.toLowerCase().includes(busqueda));

        const coincideEstado =
          estado === "todos" || a.estado_documental === estado;
        const coincideCarrera = carrera === "todas" || a.carrera === carrera;
        const coincideEmpresa = empresa === "todas" || a.empresa === empresa;
        const coincideAsesor = asesor === "todos" || a.asesor === asesor;
        const coincideFase = fase === "todas" || a.fase === fase;

        return (
          coincideBusqueda &&
          coincideEstado &&
          coincideCarrera &&
          coincideEmpresa &&
          coincideAsesor &&
          coincideFase
        );
      })
      .sort(
        (a, b) =>
          a.prioridad - b.prioridad ||
          a.nombre.localeCompare(b.nombre, "es"),
      );
  }, [alumnos, q, estado, carrera, empresa, asesor, fase]);

  function limpiarFiltros() {
    setQ("");
    setEstado("todos");
    setCarrera("todas");
    setEmpresa("todas");
    setAsesor("todos");
    setFase("todas");
  }

  const estados = useMemo(
    () => [...new Set(alumnos.map((a) => a.estado_documental))],
    [alumnos],
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Gestion de Alumnos
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Control de expedientes, seleccion de empresa, asignacion, asesores y
          seguimiento de alumnos en practicas profesionales.
        </p>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { l: "Total", v: conteo.total, I: Users },
          { l: "Inicial aprobado", v: conteo.listos, I: CheckCircle2 },
          { l: "En revisión", v: conteo.enRevision, I: Clock },
          { l: "Observados", v: conteo.observados, I: AlertTriangle },
          { l: "Asignados", v: conteo.asignados, I: ClipboardCheck },
        ].map((item) => (
          <div
            key={item.l}
            className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <item.I className="w-4 h-4" />
            </div>

            <div>
              <div className="text-lg font-bold text-[#0d2b5e]">
                {cargando ? "..." : item.v}
              </div>
              <div className="text-xs text-gray-500">{item.l}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e] text-sm">
              Filtros de gestion
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

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por alumno, matricula, carrera, empresa o asesor..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1565c0]"
            />
          </div>

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1565c0]"
          >
            <option value="todos">Todos los estados</option>
            {estados.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={fase}
            onChange={(e) => setFase(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1565c0]"
          >
            <option value="todas">Todas las fases</option>
            {fases.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={carrera}
            onChange={(e) => setCarrera(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1565c0]"
          >
            <option value="todas">Todas las carreras</option>
            {carreras.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1565c0]"
          >
            <option value="todas">Todas las empresas</option>
            {empresas.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>

          <select
            value={asesor}
            onChange={(e) => setAsesor(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1565c0]"
          >
            <option value="todos">Todos los asesores</option>
            {asesores.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">Alumnos gestionados</h3>
          <span className="ml-auto text-xs text-gray-400">
            {filtrados.length} resultados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Alumno",
                  "Carrera",
                  "Empresa",
                  "Asesor",
                  "Fase",
                  "Documentos",
                  "Estado",
                  "Siguiente paso",
                  "Accion",
                ].map((h) => (
                  <th
                    key={h}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filtrados.map((a) => (
                <tr key={a.id_alumno} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-[#e3f0ff] rounded-lg flex items-center justify-center text-[#1565c0] font-bold text-sm">
                        {a.nombre.charAt(0)}
                      </div>

                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {a.nombre}
                        </div>
                        <div className="text-xs text-gray-400 font-mono">
                          {a.matricula}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {a.carrera}
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-gray-400" />
                      {a.empresa}
                    </div>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {a.asesor}
                  </td>

                  <td className="px-6 py-4">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold bg-blue-50 text-blue-700">
                      {a.fase}
                    </span>
                  </td>

                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-gray-600">
                      <FileCheck className="w-3.5 h-3.5 text-[#1565c0]" />
                      {a.resumen.aprobados}/{a.resumen.total} aprobados
                    </div>
                    {a.resumen.observados > 0 && (
                      <div className="text-xs text-orange-600 mt-1">
                        {a.resumen.observados} con observaciones
                      </div>
                    )}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${estadoColor(
                        a.estado_documental,
                      )}`}
                    >
                      {a.estado_documental}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm text-gray-600">
                    {a.siguiente_paso}
                  </td>

                  <td className="px-6 py-4">
                    <button
                      onClick={() => navigate(rutaDocumentosAlumno(a))}
                      className="flex items-center gap-1 text-xs text-[#1565c0] hover:underline font-medium"
                    >
                      Gestionar
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}

              {!cargando && filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-10 text-center text-sm text-gray-400"
                  >
                    No se encontraron alumnos con los filtros seleccionados.
                  </td>
                </tr>
              )}

              {cargando && (
                <tr>
                  <td
                    colSpan={9}
                    className="px-6 py-10 text-center text-sm text-gray-400"
                  >
                    Cargando alumnos...
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
