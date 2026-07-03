import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Clock,
  Filter,
  GraduationCap,
  RotateCcw,
  Search,
  Users,
  FileCheck,
} from "lucide-react";

import { apiClient } from "../../../infrastructure/api/apiClient";

type AlumnoGestion = {
  id_alumno: number;
  id_expediente: number;
  nombre: string;
  correo?: string | null;
  matricula: string;
  semestre?: number | null;
  grupo?: string | null;
  carrera?: string | null;
  estado_alumno?: string | null;
  estado_expediente?: string | null;
  resumen: {
    aprobados: number;
    cargados: number;
    revision: number;
    observados: number;
    total: number;
  };
};

const estadoDocumental = (alumno: AlumnoGestion) => {
  if (alumno.resumen.observados > 0) {
    return { key: "observado", label: "Con observaciones", color: "bg-orange-100 text-orange-700", prioridad: 1 };
  }
  if (alumno.resumen.revision > 0) {
    return { key: "en_revision", label: "En revision", color: "bg-yellow-100 text-yellow-700", prioridad: 2 };
  }
  if (alumno.resumen.total > 0 && alumno.resumen.aprobados >= 7) {
    return { key: "completo", label: "7 docs aprobados", color: "bg-green-100 text-green-700", prioridad: 3 };
  }
  return { key: "pendiente", label: "Pendiente", color: "bg-gray-100 text-gray-600", prioridad: 4 };
};

export function GestionAlumnos() {
  const navigate = useNavigate();
  const [alumnos, setAlumnos] = useState<AlumnoGestion[]>([]);
  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("todos");
  const [carrera, setCarrera] = useState("todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const cargar = async () => {
      try {
        setLoading(true);
        setError("");
        const response = await apiClient.get<AlumnoGestion[]>("/coordinador/documentos/alumnos");
        setAlumnos(response.data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la gestion de alumnos.");
      } finally {
        setLoading(false);
      }
    };

    cargar();
  }, []);

  const carreras = useMemo(
    () => [...new Set(alumnos.map((a) => a.carrera).filter(Boolean))] as string[],
    [alumnos],
  );

  const conteo = useMemo(() => ({
    total: alumnos.length,
    completo: alumnos.filter((a) => estadoDocumental(a).key === "completo").length,
    en_revision: alumnos.filter((a) => estadoDocumental(a).key === "en_revision").length,
    observado: alumnos.filter((a) => estadoDocumental(a).key === "observado").length,
    pendiente: alumnos.filter((a) => estadoDocumental(a).key === "pendiente").length,
  }), [alumnos]);

  const filtrados = useMemo(() => {
    return alumnos
      .filter((alumno) => {
        const texto = `${alumno.nombre} ${alumno.matricula} ${alumno.carrera ?? ""} ${alumno.correo ?? ""}`.toLowerCase();
        const coincideBusqueda = texto.includes(q.toLowerCase());
        const estadoActual = estadoDocumental(alumno).key;
        const coincideEstado = estado === "todos" || estadoActual === estado;
        const coincideCarrera = carrera === "todas" || alumno.carrera === carrera;
        return coincideBusqueda && coincideEstado && coincideCarrera;
      })
      .sort((a, b) => estadoDocumental(a).prioridad - estadoDocumental(b).prioridad || a.nombre.localeCompare(b.nombre));
  }, [alumnos, q, estado, carrera]);

  const limpiarFiltros = () => {
    setQ("");
    setEstado("todos");
    setCarrera("todas");
  };

  const getSiguientePaso = (alumno: AlumnoGestion) => {
    const estadoActual = estadoDocumental(alumno).key;
    if (estadoActual === "observado") return "Esperar correccion del alumno";
    if (estadoActual === "en_revision") return "Revisar documentos cargados";
    if (estadoActual === "completo") return "Habilitar seleccion de empresa";
    return "Esperar carga de documentos";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Gestion de Alumnos</h1>
        <p className="text-gray-500 text-sm mt-1">Control real de alumnos, expedientes y avance documental desde la base de datos.</p>
      </div>

      {error ? <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 text-sm">{error}</div> : null}
      {loading ? <div className="text-sm text-gray-500">Cargando alumnos...</div> : null}

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { l: "Total", v: conteo.total, I: Users },
          { l: "7 aprobados", v: conteo.completo, I: CheckCircle2 },
          { l: "En revision", v: conteo.en_revision, I: Clock },
          { l: "Observados", v: conteo.observado, I: AlertTriangle },
          { l: "Pendientes", v: conteo.pendiente, I: FileCheck },
        ].map((item) => (
          <div key={item.l} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500"><item.I className="w-4 h-4" /></div>
            <div><div className="text-lg font-bold text-[#0d2b5e]">{item.v}</div><div className="text-xs text-gray-500">{item.l}</div></div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2"><Filter className="w-4 h-4 text-[#1565c0]" /><h3 className="font-bold text-[#0d2b5e] text-sm">Filtros de gestion</h3></div>
          <button onClick={limpiarFiltros} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1565c0]"><RotateCcw className="w-3.5 h-3.5" />Limpiar filtros</button>
        </div>
        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <div className="relative xl:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input type="text" placeholder="Buscar por alumno, matricula, carrera o correo..." value={q} onChange={(e) => setQ(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#1565c0]" />
          </div>
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1565c0]">
            <option value="todos">Todos los estados</option>
            <option value="completo">7 docs aprobados</option>
            <option value="en_revision">En revision</option>
            <option value="observado">Con observaciones</option>
            <option value="pendiente">Pendientes</option>
          </select>
          <select value={carrera} onChange={(e) => setCarrera(e.target.value)} className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1565c0]">
            <option value="todas">Todas las carreras</option>
            {carreras.map((item) => <option key={item} value={item}>{item}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <GraduationCap className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">Alumnos gestionados</h3>
          <span className="ml-auto text-xs text-gray-400">{filtrados.length} resultados</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>{["Alumno", "Carrera", "Expediente", "Documentos", "Estado", "Siguiente paso", "Accion"].map((h) => <th key={h} className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtrados.map((alumno) => {
                const estadoActual = estadoDocumental(alumno);
                return (
                  <tr key={alumno.id_alumno} className="hover:bg-gray-50">
                    <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-8 h-8 bg-[#e3f0ff] rounded-lg flex items-center justify-center text-[#1565c0] font-bold text-sm">{alumno.nombre.charAt(0)}</div><div><div className="text-sm font-medium text-gray-800">{alumno.nombre}</div><div className="text-xs text-gray-400 font-mono">{alumno.matricula}</div></div></div></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{alumno.carrera ?? "No registrada"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">#{alumno.id_expediente} - {alumno.estado_expediente ?? "Sin estado"}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{alumno.resumen.aprobados}/{alumno.resumen.total} aprobados · {alumno.resumen.revision} en revision</td>
                    <td className="px-6 py-4"><span className={`text-xs px-3 py-1 rounded-full font-semibold ${estadoActual.color}`}>{estadoActual.label}</span></td>
                    <td className="px-6 py-4 text-sm text-gray-600">{getSiguientePaso(alumno)}</td>
                    <td className="px-6 py-4"><button onClick={() => navigate("/coordinador/documentos")} className="flex items-center gap-1 text-xs text-[#1565c0] hover:underline font-medium">Gestionar<ChevronRight className="w-3.5 h-3.5" /></button></td>
                  </tr>
                );
              })}
              {filtrados.length === 0 && <tr><td colSpan={7} className="px-6 py-10 text-center text-sm text-gray-400">No se encontraron alumnos con los filtros seleccionados.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}