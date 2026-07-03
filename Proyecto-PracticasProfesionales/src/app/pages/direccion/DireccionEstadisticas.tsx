import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import {
  Filter,
  Download,
  RotateCcw,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Building2,
} from "lucide-react";

const registros = [
  {
    convocatoria: "Verano 2026",
    carrera: "Sistemas Computacionales",
    tipo: "Semestral",
    total: 245,
    enProceso: 180,
    concluidas: 42,
    observaciones: 23,
    rezagados: 8,
    incidenciasDocumentos: 7,
    incidenciasEmpresa: 4,
    incidenciasAlumno: 6,
    incidenciasConvenio: 2,
    cumplimiento: {
      cartaExposicion: 92,
      cartaPresentacion: 88,
      cartaAsignacion: 84,
      reportes: 76,
      evaluacionEmpresa: 70,
      liberacion: 64,
    },
  },
  {
    convocatoria: "Verano 2026",
    carrera: "Ing. en Semiconductores",
    tipo: "Semestral",
    total: 189,
    enProceso: 120,
    concluidas: 50,
    observaciones: 19,
    rezagados: 6,
    incidenciasDocumentos: 5,
    incidenciasEmpresa: 2,
    incidenciasAlumno: 4,
    incidenciasConvenio: 2,
    cumplimiento: {
      cartaExposicion: 90,
      cartaPresentacion: 86,
      cartaAsignacion: 80,
      reportes: 72,
      evaluacionEmpresa: 68,
      liberacion: 60,
    },
  },
  {
    convocatoria: "Verano 2026",
    carrera: "IA y Ciencia de Datos",
    tipo: "Cuatrimestral",
    total: 156,
    enProceso: 98,
    concluidas: 40,
    observaciones: 18,
    rezagados: 5,
    incidenciasDocumentos: 4,
    incidenciasEmpresa: 3,
    incidenciasAlumno: 4,
    incidenciasConvenio: 1,
    cumplimiento: {
      cartaExposicion: 94,
      cartaPresentacion: 90,
      cartaAsignacion: 82,
      reportes: 78,
      evaluacionEmpresa: 71,
      liberacion: 66,
    },
  },
  {
    convocatoria: "Verano 2026",
    carrera: "Arquitectura de Sistemas IA",
    tipo: "Cuatrimestral",
    total: 134,
    enProceso: 80,
    concluidas: 36,
    observaciones: 18,
    rezagados: 4,
    incidenciasDocumentos: 3,
    incidenciasEmpresa: 2,
    incidenciasAlumno: 5,
    incidenciasConvenio: 1,
    cumplimiento: {
      cartaExposicion: 88,
      cartaPresentacion: 84,
      cartaAsignacion: 79,
      reportes: 70,
      evaluacionEmpresa: 63,
      liberacion: 58,
    },
  },
  {
    convocatoria: "Verano 2026",
    carrera: "Desarrollo y Tec. Software",
    tipo: "Semestral",
    total: 120,
    enProceso: 72,
    concluidas: 31,
    observaciones: 17,
    rezagados: 7,
    incidenciasDocumentos: 6,
    incidenciasEmpresa: 3,
    incidenciasAlumno: 4,
    incidenciasConvenio: 1,
    cumplimiento: {
      cartaExposicion: 91,
      cartaPresentacion: 87,
      cartaAsignacion: 81,
      reportes: 74,
      evaluacionEmpresa: 69,
      liberacion: 61,
    },
  },
];

const avanceMensualBase = [
  { mes: "Jun", horas: 10400, concluidas: 12 },
  { mes: "Jul", horas: 15800, concluidas: 36 },
  { mes: "Ago", horas: 18200, concluidas: 74 },
  { mes: "Sep", horas: 22100, concluidas: 126 },
  { mes: "Oct", horas: 28400, concluidas: 211 },
  { mes: "Nov", horas: 31560, concluidas: 312 },
];

export function DireccionEstadisticas() {
  const [convocatoria, setConvocatoria] = useState("Verano 2026");
  const [carrera, setCarrera] = useState("Todas");
  const [tipo, setTipo] = useState("Todos");
  const [estado, setEstado] = useState("Todos");
  const [incidencia, setIncidencia] = useState("Todas");

  const carreras = ["Todas", ...new Set(registros.map((r) => r.carrera))];
  const convocatorias = [...new Set(registros.map((r) => r.convocatoria))];

  const datosFiltrados = useMemo(() => {
    return registros.filter((r) => {
      const okConvocatoria = r.convocatoria === convocatoria;
      const okCarrera = carrera === "Todas" || r.carrera === carrera;
      const okTipo = tipo === "Todos" || r.tipo === tipo;

      return okConvocatoria && okCarrera && okTipo;
    });
  }, [convocatoria, carrera, tipo]);

  const resumen = useMemo(() => {
    const total = datosFiltrados.reduce((acc, r) => acc + r.total, 0);
    const enProceso = datosFiltrados.reduce((acc, r) => acc + r.enProceso, 0);
    const concluidas = datosFiltrados.reduce((acc, r) => acc + r.concluidas, 0);
    const observaciones = datosFiltrados.reduce(
      (acc, r) => acc + r.observaciones,
      0,
    );
    const rezagados = datosFiltrados.reduce((acc, r) => acc + r.rezagados, 0);

    const incidenciasDocumentos = datosFiltrados.reduce(
      (acc, r) => acc + r.incidenciasDocumentos,
      0,
    );
    const incidenciasEmpresa = datosFiltrados.reduce(
      (acc, r) => acc + r.incidenciasEmpresa,
      0,
    );
    const incidenciasAlumno = datosFiltrados.reduce(
      (acc, r) => acc + r.incidenciasAlumno,
      0,
    );
    const incidenciasConvenio = datosFiltrados.reduce(
      (acc, r) => acc + r.incidenciasConvenio,
      0,
    );

    return {
      total,
      enProceso,
      concluidas,
      observaciones,
      rezagados,
      incidenciasDocumentos,
      incidenciasEmpresa,
      incidenciasAlumno,
      incidenciasConvenio,
      avance: total > 0 ? Math.round((concluidas / total) * 100) : 0,
    };
  }, [datosFiltrados]);

  const documentos = useMemo(() => {
    const n = datosFiltrados.length || 1;

    const promedio = (key: keyof (typeof registros)[number]["cumplimiento"]) =>
      Math.round(
        datosFiltrados.reduce((acc, r) => acc + r.cumplimiento[key], 0) / n,
      );

    return [
      { documento: "Exposición motivos", porcentaje: promedio("cartaExposicion") },
      { documento: "Carta presentación", porcentaje: promedio("cartaPresentacion") },
      { documento: "Carta asignación", porcentaje: promedio("cartaAsignacion") },
      { documento: "Reportes", porcentaje: promedio("reportes") },
      { documento: "Eval. empresa", porcentaje: promedio("evaluacionEmpresa") },
      { documento: "Liberación", porcentaje: promedio("liberacion") },
    ];
  }, [datosFiltrados]);

  const incidencias = useMemo(() => {
    const base = [
      {
        name: "Documentos",
        value: resumen.incidenciasDocumentos,
        color: "#f97316",
      },
      {
        name: "Empresa",
        value: resumen.incidenciasEmpresa,
        color: "#1565c0",
      },
      {
        name: "Alumno",
        value: resumen.incidenciasAlumno,
        color: "#22c55e",
      },
      {
        name: "Convenio",
        value: resumen.incidenciasConvenio,
        color: "#94a3b8",
      },
    ];

    return incidencia === "Todas"
      ? base
      : base.filter((i) => i.name === incidencia);
  }, [resumen, incidencia]);

  const estadosCarrera = datosFiltrados.map((r) => ({
    carrera: r.carrera,
    total: r.total,
    enProceso: r.enProceso,
    concluidas: r.concluidas,
    observaciones: r.observaciones,
    rezagados: r.rezagados,
  }));

  const limpiarFiltros = () => {
    setConvocatoria("Verano 2026");
    setCarrera("Todas");
    setTipo("Todos");
    setEstado("Todos");
    setIncidencia("Todas");
  };

  const filasTabla = estadosCarrera.filter((r) => {
    if (estado === "Todos") return true;
    if (estado === "En proceso") return r.enProceso > 0;
    if (estado === "Concluidas") return r.concluidas > 0;
    if (estado === "Con observaciones") return r.observaciones > 0;
    if (estado === "Rezagados") return r.rezagados > 0;
    return true;
  });

  const exportarAnalisis = () => {
    alert("Análisis exportado con los filtros seleccionados.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">
            Estadísticas Detalladas — Dirección ETDA
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Consulta institucional por convocatoria, carrera, tipo de práctica,
            documentación, incidencias y estado del proceso.
          </p>
        </div>

        <button
          onClick={exportarAnalisis}
          className="border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 bg-blue-50"
        >
          <Download className="w-4 h-4" />
          Exportar análisis
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e] text-sm">
              Filtros estadísticos
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

        <div className="grid md:grid-cols-5 gap-4">
          <select
            value={convocatoria}
            onChange={(e) => setConvocatoria(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            {convocatorias.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            value={carrera}
            onChange={(e) => setCarrera(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            {carreras.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Todos</option>
            <option>Semestral</option>
            <option>Cuatrimestral</option>
          </select>

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Todos</option>
            <option>En proceso</option>
            <option>Concluidas</option>
            <option>Con observaciones</option>
            <option>Rezagados</option>
          </select>

          <select
            value={incidencia}
            onChange={(e) => setIncidencia(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Todas</option>
            <option>Documentos</option>
            <option>Empresa</option>
            <option>Alumno</option>
            <option>Convenio</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { l: "Total alumnos", v: resumen.total, I: Users },
          { l: "En proceso", v: resumen.enProceso, I: Clock },
          { l: "Concluidas", v: resumen.concluidas, I: CheckCircle2 },
          { l: "Observaciones", v: resumen.observaciones, I: AlertTriangle },
          { l: "Avance", v: `${resumen.avance}%`, I: FileText },
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

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5">
            Cumplimiento documental promedio
          </h3>

          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={documentos}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="documento"
                tick={{ fontSize: 11, fill: "#6b7280" }}
              />
              <YAxis
                tick={{ fontSize: 11, fill: "#9ca3af" }}
                domain={[0, 100]}
              />
              <Tooltip formatter={(v: any) => [`${v}%`, "Cumplimiento"]} />
              <Bar dataKey="porcentaje" fill="#1565c0" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5">
            Incidencias por tipo
          </h3>

          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={incidencias}
                cx="50%"
                cy="50%"
                outerRadius={90}
                dataKey="value"
              >
                {incidencias.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {incidencias.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ background: item.color }}
                />
                <span className="text-xs text-gray-500">
                  {item.name}: {item.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-5">
          Estado de prácticas por carrera
        </h3>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-3">Carrera</th>
              <th>Total</th>
              <th>En proceso</th>
              <th>Concluidas</th>
              <th>Observaciones</th>
              <th>Rezagados</th>
            </tr>
          </thead>

          <tbody>
            {filasTabla.map((row) => (
              <tr key={row.carrera} className="border-b last:border-0">
                <td className="py-3 font-medium text-[#0d2b5e]">
                  {row.carrera}
                </td>
                <td>{row.total}</td>
                <td>{row.enProceso}</td>
                <td>{row.concluidas}</td>
                <td>{row.observaciones}</td>
                <td>{row.rezagados}</td>
              </tr>
            ))}

            {filasTabla.length === 0 && (
              <tr>
                <td colSpan={6} className="py-8 text-center text-gray-400">
                  No hay datos con los filtros seleccionados.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}