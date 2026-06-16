import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  TrendingUp,
  Users,
  Building2,
  FileText,
  Award,
  Eye,
  Download,
  Filter,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Database,
  RotateCcw,
} from "lucide-react";

const carrerasData = [
  { c: "Sistemas Computacionales", a: 245 },
  { c: "Ing. en Semiconductores", a: 189 },
  { c: "IA y Ciencia de Datos", a: 156 },
  { c: "Arquitectura de Sistemas IA", a: 134 },
  { c: "Desarrollo y Tec. Software", a: 120 },
];

const horasData = [
  { m: "Jun", h: 10400 },
  { m: "Jul", h: 15800 },
  { m: "Ago", h: 18200 },
  { m: "Sep", h: 22100 },
  { m: "Oct", h: 28400 },
  { m: "Nov", h: 31560 },
];

const estadoData = [
  { name: "Concluidos", value: 312, color: "#22c55e" },
  { name: "En prácticas", value: 648, color: "#1565c0" },
  { name: "Rezagados", value: 43, color: "#f59e0b" },
  { name: "Pendientes", value: 245, color: "#94a3b8" },
];

const conveniosData = [
  { estado: "Vigentes", total: 22 },
  { estado: "Por vencer", total: 8 },
  { estado: "Vencidos", total: 3 },
];

export function DireccionDashboard() {
  const [convocatoria, setConvocatoria] = useState("Verano 2026");
  const [carrera, setCarrera] = useState("Todas");
  const [estado, setEstado] = useState("Todos");
  const [tipo, setTipo] = useState("Todos");

  const totalAlumnos = 844;
  const concluidos = 312;
  const enPracticas = 648;
  const rezagados = 43;
  const empresasActivas = 48;
  const conveniosActivos = 22;
  const conveniosPorVencer = 8;
  const horasRegistradas = 48560;
  const avanceGeneral = Math.round((concluidos / totalAlumnos) * 100);

  const resumen = useMemo(
    () => [
      {
        l: "Alumnos registrados",
        v: totalAlumnos.toLocaleString(),
        I: Users,
      },
      {
        l: "En prácticas",
        v: enPracticas.toLocaleString(),
        I: Clock,
      },
      {
        l: "Empresas activas",
        v: empresasActivas.toString(),
        I: Building2,
      },
      {
        l: "Convenios vigentes",
        v: conveniosActivos.toString(),
        I: FileText,
      },
      {
        l: "Avance general",
        v: `${avanceGeneral}%`,
        I: TrendingUp,
      },
    ],
    [avanceGeneral],
  );

  const limpiarFiltros = () => {
    setConvocatoria("Verano 2026");
    setCarrera("Todas");
    setEstado("Todos");
    setTipo("Todos");
  };

  const exportarDatos = () => {
    alert("Exportación de datos brutos generada para auditoría.");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">
            Dashboard Institucional — Prácticas Profesionales
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Vista de consulta para Dirección / Secretaría · Datos actualizados al
            03 jun 2026.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">
            <Eye className="w-4 h-4 text-[#1565c0]" />
            <span className="text-xs text-[#1565c0] font-semibold">
              Solo lectura
            </span>
          </div>

          <button
            onClick={exportarDatos}
            className="flex items-center gap-2 bg-[#0d2b5e] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#1565c0]"
          >
            <Download className="w-4 h-4" />
            Exportar datos brutos
          </button>
        </div>
      </div>

      {/* Filtros institucionales */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e] text-sm">
              Filtros de consulta institucional
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

        <div className="grid md:grid-cols-4 gap-3">
          <select
            value={convocatoria}
            onChange={(e) => setConvocatoria(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
          >
            <option>Verano 2026</option>
            <option>Agosto-Diciembre 2026</option>
            <option>Verano 2025</option>
          </select>

          <select
            value={carrera}
            onChange={(e) => setCarrera(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
          >
            <option>Todas</option>
            {carrerasData.map((c) => (
              <option key={c.c}>{c.c}</option>
            ))}
          </select>

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
          >
            <option>Todos</option>
            <option>En prácticas</option>
            <option>Concluidos</option>
            <option>Rezagados</option>
            <option>Pendientes</option>
          </select>

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="border border-gray-200 rounded-xl px-3 py-2.5 text-sm bg-white"
          >
            <option>Todos</option>
            <option>Semestral</option>
            <option>Cuatrimestral</option>
            <option>Residencia</option>
          </select>
        </div>
      </div>

      {/* Indicadores discretos */}
      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {resumen.map((k) => (
          <div
            key={k.l}
            className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <k.I className="w-4 h-4" />
            </div>

            <div>
              <div className="text-lg font-bold text-[#0d2b5e]">{k.v}</div>
              <div className="text-xs text-gray-500">{k.l}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Alertas institucionales */}
      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            t: "Convenios próximos a vencer",
            v: conveniosPorVencer,
            s: "Requieren seguimiento por vinculación.",
            c: "bg-orange-50 border-orange-200 text-orange-700",
            I: AlertTriangle,
          },
          {
            t: "Alumnos rezagados",
            v: rezagados,
            s: "Pendientes de asignación o seguimiento.",
            c: "bg-yellow-50 border-yellow-200 text-yellow-700",
            I: Clock,
          },
          {
            t: "Prácticas concluidas",
            v: concluidos,
            s: "Expedientes cerrados satisfactoriamente.",
            c: "bg-green-50 border-green-200 text-green-700",
            I: CheckCircle2,
          },
        ].map((a) => (
          <div key={a.t} className={`${a.c} border rounded-2xl p-5`}>
            <div className="flex items-start justify-between">
              <div>
                <div className="text-2xl font-bold">{a.v}</div>
                <div className="font-semibold text-sm mt-1">{a.t}</div>
                <div className="text-xs mt-1 opacity-80">{a.s}</div>
              </div>
              <a.I className="w-5 h-5 opacity-80" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5">
            Alumnos por carrera
          </h3>

          <ResponsiveContainer width="100%" height={240}>
            <BarChart
              data={carrerasData.map((d) => ({
                carrera: d.c,
                alumnos: d.a,
              }))}
              layout="vertical"
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#f0f0f0"
                horizontal={false}
              />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis
                type="category"
                dataKey="carrera"
                width={115}
                tick={{ fontSize: 10, fill: "#6b7280" }}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                  fontSize: "12px",
                }}
              />
              <Bar dataKey="alumnos" fill="#1565c0" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5">
            Estado general del proceso
          </h3>

          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie
                data={estadoData}
                cx="50%"
                cy="50%"
                outerRadius={85}
                dataKey="value"
              >
                {estadoData.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                }}
              />
            </PieChart>
          </ResponsiveContainer>

          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {estadoData.map((item) => (
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

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5">
            Horas registradas por mes
          </h3>

          <ResponsiveContainer width="100%" height={220}>
            <LineChart
              data={horasData.map((d) => ({
                mes: d.m,
                horas: d.h,
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="mes"
                tick={{ fontSize: 12, fill: "#9ca3af" }}
              />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                }}
                formatter={(v: any) => [
                  `${Number(v).toLocaleString()} hrs`,
                ]}
              />
              <Line
                type="monotone"
                dataKey="horas"
                stroke="#1565c0"
                strokeWidth={3}
                dot={{ fill: "#1565c0", r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5">
            Estado de convenios
          </h3>

          <div className="space-y-4">
            {conveniosData.map((c) => (
              <div key={c.estado}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{c.estado}</span>
                  <span className="font-semibold text-[#0d2b5e]">
                    {c.total}
                  </span>
                </div>

                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${
                      c.estado === "Vigentes"
                        ? "bg-green-500"
                        : c.estado === "Por vencer"
                          ? "bg-orange-500"
                          : "bg-red-500"
                    }`}
                    style={{
                      width: `${(c.total / 33) * 100}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
            <Database className="w-5 h-5 text-gray-500 mt-0.5" />
            <p className="text-xs text-gray-500">
              Esta vista no modifica registros. Su propósito es consultar
              indicadores, históricos y datos brutos para revisión institucional.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}