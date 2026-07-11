import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Eye,
  FileText,
  TrendingUp,
  Users,
} from "lucide-react";

import type { DireccionIndicadoresResponse } from "../../../domain/direccion/DireccionIndicadores";
import { descargarDireccionCsv, obtenerIndicadoresDireccion } from "../../../infrastructure/direccion/direccionApi";

const colores = ["#1565c0", "#22c55e", "#f59e0b", "#ef4444", "#94a3b8", "#7c3aed"];

export function DireccionDashboard() {
  const [datos, setDatos] = useState<DireccionIndicadoresResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void cargar();
  }, []);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      setDatos(await obtenerIndicadoresDireccion());
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los indicadores institucionales.");
    } finally {
      setCargando(false);
    }
  }

  const resumen = datos?.resumen;
  const avanceGeneral = resumen?.alumnos ? Math.round((resumen.concluidos / resumen.alumnos) * 100) : 0;

  const estadoData = useMemo(
    () =>
      (datos?.alumnos_por_estado ?? []).map((item, index) => ({
        name: item.nombre,
        value: item.total,
        color: colores[index % colores.length],
      })),
    [datos],
  );

  const conveniosData = datos?.convenios_por_estado ?? [];

  const tarjetas = [
    { l: "Alumnos registrados", v: resumen?.alumnos ?? 0, I: Users },
    { l: "En practicas", v: resumen?.en_practicas ?? 0, I: Clock },
    { l: "Empresas activas", v: resumen?.empresas_activas ?? 0, I: Building2 },
    { l: "Convenios vigentes", v: resumen?.convenios_vigentes ?? 0, I: FileText },
    { l: "Avance general", v: `${avanceGeneral}%`, I: TrendingUp },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">
            Dashboard Institucional - Practicas Profesionales
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Vista de consulta para Direccion / Secretaria. Actualizado: {datos?.contexto.fecha_actualizacion ?? "..."}.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-xl">
            <Eye className="w-4 h-4 text-[#1565c0]" />
            <span className="text-xs text-[#1565c0] font-semibold">Solo lectura</span>
          </div>

          <button
            onClick={() => void descargarDireccionCsv("brutos")}
            className="flex items-center gap-2 bg-[#0d2b5e] text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-[#1565c0]"
          >
            <Download className="w-4 h-4" />
            Exportar datos brutos
          </button>
        </div>
      </div>

      {error && <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">{error}</div>}

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {tarjetas.map((k) => (
          <div key={k.l} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <k.I className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0d2b5e]">{cargando ? "..." : k.v}</div>
              <div className="text-xs text-gray-500">{k.l}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          {
            t: "Convenios proximos a vencer",
            v: resumen?.convenios_por_vencer ?? 0,
            s: "Requieren seguimiento institucional.",
            c: "bg-orange-50 border-orange-200 text-orange-700",
            I: AlertTriangle,
          },
          {
            t: "Alumnos rezagados",
            v: resumen?.rezagados ?? 0,
            s: "Asignaciones marcadas como rezagadas.",
            c: "bg-yellow-50 border-yellow-200 text-yellow-700",
            I: Clock,
          },
          {
            t: "Practicas concluidas",
            v: resumen?.concluidos ?? 0,
            s: "Liberaciones registradas en el sistema.",
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
          <h3 className="font-bold text-[#0d2b5e] mb-5">Alumnos por carrera</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={datos?.alumnos_por_carrera ?? []} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <YAxis type="category" dataKey="carrera" width={130} tick={{ fontSize: 10, fill: "#6b7280" }} />
              <Tooltip />
              <Bar dataKey="alumnos" fill="#1565c0" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5">Estado general de alumnos</h3>
          <ResponsiveContainer width="100%" height={240}>
            <PieChart>
              <Pie data={estadoData} cx="50%" cy="50%" outerRadius={85} dataKey="value">
                {estadoData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {estadoData.map((item) => (
              <div key={item.name} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full" style={{ background: item.color }} />
                <span className="text-xs text-gray-500">{item.name}: {item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5">Horas registradas por mes</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={datos?.horas_por_mes ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
              <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} hrs`]} />
              <Line type="monotone" dataKey="horas" stroke="#1565c0" strokeWidth={3} dot={{ fill: "#1565c0", r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5">Estado de convenios</h3>
          <div className="space-y-4">
            {conveniosData.map((c) => (
              <div key={c.nombre}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{c.nombre}</span>
                  <span className="font-semibold text-[#0d2b5e]">{c.total}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-2 rounded-full bg-[#1565c0]" style={{ width: `${Math.min(100, c.total * 10)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-start gap-3">
            <Database className="w-5 h-5 text-gray-500 mt-0.5" />
            <p className="text-xs text-gray-500">
              Esta vista consulta indicadores reales y no modifica registros.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
