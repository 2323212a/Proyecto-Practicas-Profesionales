import { useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  Search,
  Filter,
  ChevronRight,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  GraduationCap,
  ClipboardCheck,
  RotateCcw,
} from "lucide-react";

const alumnos = [
  {
    n: "Carlos López Ramos",
    m: "215A10234",
    c: "Sistemas Computacionales",
    e: "pendiente",
    empresa: "Sin asignar",
    docente: "Sin asignar",
    tipo: "Semestral",
    horas: 0,
    observaciones: 2,
  },
  {
    n: "Laura Martínez Cruz",
    m: "216B20145",
    c: "Sistemas Computacionales",
    e: "en_revision",
    empresa: "TecnoSoluciones MX",
    docente: "Mtra. Elena Cruz",
    tipo: "Cuatrimestral",
    horas: 42,
    observaciones: 1,
  },
  {
    n: "Diego Sánchez Pérez",
    m: "214C30067",
    c: "Arquitectura de Sistemas IA",
    e: "pendiente",
    empresa: "Sin asignar",
    docente: "Sin asignar",
    tipo: "Semestral",
    horas: 0,
    observaciones: 3,
  },
  {
    n: "Ana González Ruiz",
    m: "215D40189",
    c: "Arquitectura de Sistemas IA",
    e: "completo",
    empresa: "DataVision Lab",
    docente: "Dr. Arturo Méndez",
    tipo: "Semestral",
    horas: 120,
    observaciones: 0,
  },
  {
    n: "Miguel Torres Flores",
    m: "216E50234",
    c: "IA y Ciencia de Datos",
    e: "completo",
    empresa: "InnovaData",
    docente: "Mtra. Karla Ruiz",
    tipo: "Cuatrimestral",
    horas: 108,
    observaciones: 0,
  },
  {
    n: "Sofía Ramírez Luna",
    m: "213F60321",
    c: "IA y Ciencia de Datos",
    e: "en_revision",
    empresa: "InnovaData",
    docente: "Mtra. Karla Ruiz",
    tipo: "Cuatrimestral",
    horas: 36,
    observaciones: 1,
  },
  {
    n: "José Hernández Vega",
    m: "216G70456",
    c: "Ing. en Semiconductores",
    e: "pendiente",
    empresa: "Sin asignar",
    docente: "Sin asignar",
    tipo: "Semestral",
    horas: 0,
    observaciones: 2,
  },
  {
    n: "María Jiménez Castillo",
    m: "215H80567",
    c: "Ing. en Semiconductores",
    e: "completo",
    empresa: "Chiapas Tech",
    docente: "Dr. Roberto Silva",
    tipo: "Semestral",
    horas: 96,
    observaciones: 0,
  },
  {
    n: "Brayan Madain Hernandez",
    m: "215A10234",
    c: "Desarrollo y Tec. Software",
    e: "en_revision",
    empresa: "ETDA - UNACH",
    docente: "Mtro. José Aguilar",
    tipo: "Semestral",
    horas: 28,
    observaciones: 1,
  },
  {
    n: "Patricia Álvarez Mora",
    m: "216J00789",
    c: "Desarrollo y Tec. Software",
    e: "pendiente",
    empresa: "Sin asignar",
    docente: "Sin asignar",
    tipo: "Cuatrimestral",
    horas: 0,
    observaciones: 2,
  },
];

const estadoConfig: Record<
  string,
  { label: string; color: string; prioridad: number }
> = {
  pendiente: {
    label: "Pendiente de corrección",
    color: "bg-orange-100 text-orange-700",
    prioridad: 1,
  },
  en_revision: {
    label: "En revisión",
    color: "bg-yellow-100 text-yellow-700",
    prioridad: 2,
  },
  completo: {
    label: "Listo para asignación",
    color: "bg-green-100 text-green-700",
    prioridad: 3,
  },
};

export function GestionAlumnos() {
  const navigate = useNavigate();

  const [q, setQ] = useState("");
  const [estado, setEstado] = useState("todos");
  const [carrera, setCarrera] = useState("todas");
  const [empresa, setEmpresa] = useState("todas");
  const [docente, setDocente] = useState("todos");
  const [tipo, setTipo] = useState("todos");
  const [horas, setHoras] = useState("todas");

  const carreras = [...new Set(alumnos.map((a) => a.c))];
  const empresas = [...new Set(alumnos.map((a) => a.empresa))];
  const docentes = [...new Set(alumnos.map((a) => a.docente))];

  const conteo = {
    total: alumnos.length,
    completo: alumnos.filter((a) => a.e === "completo").length,
    en_revision: alumnos.filter((a) => a.e === "en_revision").length,
    pendiente: alumnos.filter((a) => a.e === "pendiente").length,
    pocasHoras: alumnos.filter((a) => a.horas > 0 && a.horas < 50).length,
  };

  const filtrados = useMemo(() => {
    return alumnos
      .filter((a) => {
        const coincideBusqueda =
          a.n.toLowerCase().includes(q.toLowerCase()) ||
          a.m.toLowerCase().includes(q.toLowerCase()) ||
          a.c.toLowerCase().includes(q.toLowerCase()) ||
          a.empresa.toLowerCase().includes(q.toLowerCase()) ||
          a.docente.toLowerCase().includes(q.toLowerCase());

        const coincideEstado = estado === "todos" || a.e === estado;
        const coincideCarrera = carrera === "todas" || a.c === carrera;
        const coincideEmpresa = empresa === "todas" || a.empresa === empresa;
        const coincideDocente = docente === "todos" || a.docente === docente;
        const coincideTipo = tipo === "todos" || a.tipo === tipo;

        const coincideHoras =
          horas === "todas" ||
          (horas === "sin_horas" && a.horas === 0) ||
          (horas === "pocas" && a.horas > 0 && a.horas < 50) ||
          (horas === "avance" && a.horas >= 50 && a.horas < 100) ||
          (horas === "suficientes" && a.horas >= 100);

        return (
          coincideBusqueda &&
          coincideEstado &&
          coincideCarrera &&
          coincideEmpresa &&
          coincideDocente &&
          coincideTipo &&
          coincideHoras
        );
      })
      .sort(
        (a, b) =>
          estadoConfig[a.e].prioridad - estadoConfig[b.e].prioridad ||
          a.horas - b.horas,
      );
  }, [q, estado, carrera, empresa, docente, tipo, horas]);

  const limpiarFiltros = () => {
    setQ("");
    setEstado("todos");
    setCarrera("todas");
    setEmpresa("todas");
    setDocente("todos");
    setTipo("todos");
    setHoras("todas");
  };

  const getSiguientePaso = (a: (typeof alumnos)[number]) => {
    if (a.e === "pendiente") return "Solicitar corrección documental";
    if (a.e === "en_revision") return "Validar expediente";
    if (a.empresa === "Sin asignar") return "Asignar empresa";
    if (a.horas < 50) return "Dar seguimiento por pocas horas";
    return "Seguimiento regular";
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Gestión de Alumnos
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Control de expedientes, asignaciones, docentes, horas y seguimiento de
          alumnos en prácticas profesionales.
        </p>
      </div>

      {/* Resumen más discreto */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { l: "Total", v: conteo.total, I: Users },
          { l: "Listos", v: conteo.completo, I: CheckCircle2 },
          { l: "En revisión", v: conteo.en_revision, I: Clock },
          { l: "Pendientes", v: conteo.pendiente, I: AlertTriangle },
          { l: "Pocas horas", v: conteo.pocasHoras, I: ClipboardCheck },
        ].map((item) => (
          <div
            key={item.l}
            className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <item.I className="w-4 h-4" />
            </div>

            <div>
              <div className="text-lg font-bold text-[#0d2b5e]">{item.v}</div>
              <div className="text-xs text-gray-500">{item.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Filtros de gestión */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e] text-sm">
              Filtros de gestión
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
              placeholder="Buscar por alumno, matrícula, carrera, empresa o docente..."
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
            <option value="completo">Listos para asignación</option>
            <option value="en_revision">En revisión</option>
            <option value="pendiente">Pendientes de corrección</option>
          </select>

          <select
            value={horas}
            onChange={(e) => setHoras(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1565c0]"
          >
            <option value="todas">Todas las horas</option>
            <option value="sin_horas">Sin horas</option>
            <option value="pocas">Pocas horas</option>
            <option value="avance">Avance medio</option>
            <option value="suficientes">Horas suficientes</option>
          </select>

          <select
            value={carrera}
            onChange={(e) => setCarrera(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1565c0]"
          >
            <option value="todas">Todas las carreras</option>
            {carreras.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={empresa}
            onChange={(e) => setEmpresa(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1565c0]"
          >
            <option value="todas">Todas las empresas</option>
            {empresas.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>

          <select
            value={docente}
            onChange={(e) => setDocente(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1565c0]"
          >
            <option value="todos">Todos los docentes</option>
            {docentes.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:border-[#1565c0]"
          >
            <option value="todos">Tipo de práctica</option>
            <option value="Semestral">Semestral</option>
            <option value="Cuatrimestral">Cuatrimestral</option>
          </select>
        </div>
      </div>

      {/* Tabla */}
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
                  "Docente",
                  "Horas",
                  "Estado",
                  "Siguiente paso",
                  "Acción",
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
              {filtrados.map((a) => {
                const estadoActual = estadoConfig[a.e];

                return (
                  <tr key={`${a.m}-${a.n}`} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[#e3f0ff] rounded-lg flex items-center justify-center text-[#1565c0] font-bold text-sm">
                          {a.n.charAt(0)}
                        </div>

                        <div>
                          <div className="text-sm font-medium text-gray-800">
                            {a.n}
                          </div>
                          <div className="text-xs text-gray-400 font-mono">
                            {a.m}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {a.c}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-gray-400" />
                        {a.empresa}
                      </div>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {a.docente}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                          a.horas === 0
                            ? "bg-gray-100 text-gray-600"
                            : a.horas < 50
                              ? "bg-red-100 text-red-700"
                              : a.horas < 100
                                ? "bg-yellow-100 text-yellow-700"
                                : "bg-green-100 text-green-700"
                        }`}
                      >
                        {a.horas} hrs
                      </span>
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${estadoActual.color}`}
                      >
                        {estadoActual.label}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-600">
                      {getSiguientePaso(a)}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => navigate("/coordinador/documentos")}
                        className="flex items-center gap-1 text-xs text-[#1565c0] hover:underline font-medium"
                      >
                        Gestionar
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtrados.length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-10 text-center text-sm text-gray-400"
                  >
                    No se encontraron alumnos con los filtros seleccionados.
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