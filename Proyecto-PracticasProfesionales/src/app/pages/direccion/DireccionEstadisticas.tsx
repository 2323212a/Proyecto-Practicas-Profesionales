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
  Download,
  FileText,
  Users,
} from "lucide-react";

import type { DireccionIndicadoresResponse } from "../../../domain/direccion/DireccionIndicadores";
import { descargarDireccionCsv, obtenerIndicadoresDireccion } from "../../../infrastructure/direccion/direccionApi";

const colores = ["#1565c0", "#f97316", "#22c55e", "#94a3b8", "#7c3aed"];

export function DireccionEstadisticas() {
  const [datos, setDatos] = useState<DireccionIndicadoresResponse | null>(null);
  const [carrera, setCarrera] = useState("Todas");
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
      setError("No se pudieron cargar las estadisticas institucionales.");
    } finally {
      setCargando(false);
    }
  }

  const carreras = ["Todas", ...(datos?.alumnos_por_carrera.map((item) => item.carrera) ?? [])];
  const alumnosCarrera = useMemo(
    () =>
      (datos?.alumnos_por_carrera ?? []).filter((item) => carrera === "Todas" || item.carrera === carrera),
    [datos, carrera],
  );
  const incidencias = useMemo(
    () =>
      (datos?.incidencias_por_tipo ?? []).map((item, index) => ({
        name: item.nombre,
        value: item.total,
        color: colores[index % colores.length],
      })),
    [datos],
  );
  const documentos = datos?.documentos_por_estado ?? [];
  const resumen = datos?.resumen;
  const avance = resumen?.alumnos ? Math.round((resumen.concluidos / resumen.alumnos) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">
            Estadisticas Detalladas - Direccion ETDA
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Consulta institucional por carrera, documentacion, incidencias y estado del proceso.
          </p>
        </div>

        <button
          onClick={() => void descargarDireccionCsv("estadisticas")}
          className="border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 bg-blue-50"
        >
          <Download className="w-4 h-4" />
          Exportar analisis
        </button>
      </div>

      {error && <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="grid md:grid-cols-[1fr_auto] gap-4">
          <select
            value={carrera}
            onChange={(e) => setCarrera(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            {carreras.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <button onClick={() => setCarrera("Todas")} className="border rounded-xl px-4 py-2 text-sm font-semibold">
            Limpiar filtro
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-5 gap-3">
        {[
          { l: "Total alumnos", v: resumen?.alumnos ?? 0, I: Users },
          { l: "En proceso", v: resumen?.en_practicas ?? 0, I: Clock },
          { l: "Concluidas", v: resumen?.concluidos ?? 0, I: CheckCircle2 },
          { l: "Incidencias", v: resumen?.incidencias ?? 0, I: AlertTriangle },
          { l: "Avance", v: `${avance}%`, I: FileText },
        ].map((item) => (
          <div key={item.l} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <item.I className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0d2b5e]">{cargando ? "..." : item.v}</div>
              <div className="text-xs text-gray-500">{item.l}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5">Alumnos por carrera</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={alumnosCarrera}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="carrera" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip />
              <Bar dataKey="alumnos" fill="#1565c0" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5">Incidencias por reportante</h3>
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie data={incidencias} cx="50%" cy="50%" outerRadius={90} dataKey="value">
                {incidencias.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {incidencias.map((item) => (
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
          <h3 className="font-bold text-[#0d2b5e] mb-5">Horas por mes</h3>
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={datos?.horas_por_mes ?? []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: "#6b7280" }} />
              <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} />
              <Tooltip />
              <Line type="monotone" dataKey="horas" stroke="#1565c0" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5">Documentos por estado</h3>
          <div className="space-y-4">
            {documentos.map((item) => (
              <div key={item.nombre}>
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{item.nombre}</span>
                  <span className="font-semibold text-[#0d2b5e]">{item.total}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-2 rounded-full bg-[#1565c0]" style={{ width: `${Math.min(100, item.total * 10)}%` }} />
                </div>
              </div>
            ))}
            {documentos.length === 0 && <div className="text-sm text-gray-500">No hay documentos registrados.</div>}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-x-auto">
        <h3 className="font-bold text-[#0d2b5e] mb-5">Convocatorias registradas</h3>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-3">Convocatoria</th>
              <th>Periodo</th>
              <th>Alumnos</th>
              <th>Empresas</th>
              <th>Concluidas</th>
              <th>Incidencias</th>
            </tr>
          </thead>
          <tbody>
            {(datos?.convocatorias ?? []).map((row) => (
              <tr key={`${row.convocatoria}-${row.periodo}`} className="border-b last:border-0">
                <td className="py-3 font-medium text-[#0d2b5e]">{row.convocatoria}</td>
                <td>{row.periodo}</td>
                <td>{row.alumnos}</td>
                <td>{row.empresas}</td>
                <td>{row.concluidas}</td>
                <td>{row.incidencias}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="hidden">
        <Building2 />
      </div>
    </div>
  );
}
