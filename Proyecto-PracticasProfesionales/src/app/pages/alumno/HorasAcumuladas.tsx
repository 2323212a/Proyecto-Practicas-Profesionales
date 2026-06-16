import { Clock, TrendingUp, Calendar } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const semanas = [
  { s: "S1", h: 40 },
  { s: "S2", h: 40 },
  { s: "S3", h: 38 },
  { s: "S4", h: 42 },
  { s: "S5", h: 40 },
  { s: "S6", h: 40 },
  { s: "S7", h: 40 },
  { s: "S8", h: 40 },
];
const actividades = [
  {
    fecha: "03 jun 2026",
    desc: "Reunión de seguimiento con asesor interno",
    horas: 2,
  },
  {
    fecha: "02 jun 2026",
    desc: "Desarrollo de módulo de reportes",
    horas: 8,
  },
  {
    fecha: "01 jun 2026",
    desc: "Revisión de requerimientos con cliente",
    horas: 4,
  },
  {
    fecha: "31 may 2026",
    desc: "Programación backend API REST",
    horas: 8,
  },
  {
    fecha: "30 may 2026",
    desc: "Pruebas unitarias y corrección de bugs",
    horas: 6,
  },
  {
    fecha: "29 may 2026",
    desc: "Documentación técnica del sistema",
    horas: 8,
  },
    {
    fecha: "30 may 2026",
    desc: "Solucion practica de errores",
    horas: 8,
  },
];

export function HorasAcumuladas() {
  const total = 320,
    meta = 480,
    pct = Math.round((total / meta) * 100);
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Horas Acumuladas
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Seguimiento del avance de horas de prácticas
          profesionales
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        {[
          {
            v: total,
            l: "Horas acumuladas",
            I: Clock,
            bg: "bg-[#e3f0ff]",
            tc: "text-[#1565c0]",
            vc: "text-[#0d2b5e]",
          },
          {
            v: meta - total,
            l: "Horas restantes",
            I: TrendingUp,
            bg: "bg-orange-50",
            tc: "text-orange-500",
            vc: "text-orange-600",
          },
          {
            v: `${pct}%`,
            l: "Progreso general",
            I: Calendar,
            bg: "bg-green-50",
            tc: "text-green-600",
            vc: "text-green-600",
          },
        ].map((w) => (
          <div
            key={w.l}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 text-center"
          >
            <div
              className={`w-12 h-12 ${w.bg} rounded-xl flex items-center justify-center mx-auto mb-3`}
            >
              <w.I className={`w-6 h-6 ${w.tc}`} />
            </div>
            <div className={`text-3xl font-bold ${w.vc}`}>
              {w.v}
            </div>
            <div className="text-gray-500 text-sm mt-1">
              {w.l}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#0d2b5e]">
            Progreso Total
          </h3>
          <span className="text-sm text-gray-500">
            {total}/{meta} horas
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-6 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#1565c0] to-[#1976d2] h-6 rounded-full flex items-center justify-end pr-3"
            style={{ width: `${pct}%` }}
          >
            <span className="text-white text-xs font-bold">
              {pct}%
            </span>
          </div>
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>Inicio: 01 may 2026</span>
          <span>Fin estimado: 15 ago 2026</span>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-5">
          Horas por Semana
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={semanas.map((s) => ({
              semana: s.s,
              horas: s.h,
            }))}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="#f0f0f0"
            />
            <XAxis
              dataKey="semana"
              tick={{ fontSize: 12, fill: "#9ca3af" }}
            />
            <YAxis tick={{ fontSize: 12, fill: "#9ca3af" }} />
            <Tooltip
              contentStyle={{
                borderRadius: "12px",
                border: "1px solid #e5e7eb",
              }}
            />
            <Bar
              dataKey="horas"
              fill="#1565c0"
              radius={[6, 6, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <h3 className="font-bold text-[#0d2b5e]">
            Registro de Actividades
          </h3>
        </div>
        <div className="divide-y divide-gray-100">
          {actividades.map((a, i) => (
            <div
              key={i}
              className="px-6 py-4 flex items-center justify-between"
            >
              <div>
                <div className="text-sm font-medium text-gray-800">
                  {a.desc}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {a.fecha}
                </div>
              </div>
              <div className="bg-[#e3f0ff] text-[#1565c0] text-sm font-bold px-4 py-1.5 rounded-xl">
                {a.horas} hrs
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}