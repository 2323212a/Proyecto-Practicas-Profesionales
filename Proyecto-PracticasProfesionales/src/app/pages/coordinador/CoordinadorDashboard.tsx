import { useNavigate } from "react-router";
import {
  Users,
  FileCheck,
  Clock,
  CheckCircle,
  ChevronRight,
  TrendingUp,
  Building2,
  ClipboardList,
  Bell,
  Award,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const pie = [
  { name: "Aprobados", value: 142, color: "#22c55e" },
  { name: "En revisión", value: 38, color: "#f59e0b" },
  { name: "Rechazados", value: 21, color: "#ef4444" },
  { name: "Pendientes", value: 47, color: "#94a3b8" },
];

const expedientes = [
  {
    n: "Brayan Madain Hernandez",
    m: "214I90678",
    c: "Desarrollo y Tec. Software",
    e: "en_revision",
  },
  {
    n: "Laura Martínez Cruz",
    m: "216B20145",
    c: "Sistemas Computacionales",
    e: "en_revision",
  },
  {
    n: "Diego Sánchez Pérez",
    m: "214C30067",
    c: "Arquitectura de Sistemas IA",
    e: "pendiente",
  },
];

export function CoordinadorDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Dashboard — Coordinador de Prácticas
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Convocatoria Verano 2026 · Escuela de Tecnologías Digitales Aplicadas C-I
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            l: "Alumnos en revisión",
            v: "47",
            I: Clock,
            c: "bg-orange-50 text-orange-600",
            t: "+5 esta semana",
          },
          {
            l: "Docs revisados",
            v: "203",
            I: FileCheck,
            c: "bg-blue-50 text-blue-600",
            t: "+18 hoy",
          },
          {
            l: "Empresas disponibles",
            v: "38",
            I: Building2,
            c: "bg-purple-50 text-purple-600",
            t: "Padrón activo",
          },
          {
            l: "Expedientes aprobados",
            v: "142",
            I: CheckCircle,
            c: "bg-green-50 text-green-600",
            t: "Listos para asignación",
          },
        ].map((w) => (
          <div
            key={w.l}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
          >
            <div
              className={`w-10 h-10 ${w.c} rounded-xl flex items-center justify-center mb-3`}
            >
              <w.I className="w-5 h-5" />
            </div>

            <div className="text-2xl font-bold text-[#0d2b5e]">
              {w.v}
            </div>

            <div className="text-gray-600 text-sm mt-0.5">
              {w.l}
            </div>

            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {w.t}
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">
            Estado de expedientes
          </h3>

          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={pie}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
              >
                {pie.map((e, i) => (
                  <Cell key={i} fill={e.color} />
                ))}
              </Pie>

              <Tooltip
                contentStyle={{
                  borderRadius: "12px",
                  border: "1px solid #e5e7eb",
                }}
              />

              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0d2b5e]">
              Expedientes por revisar
            </h3>

            <button
              onClick={() => navigate("/coordinador/alumnos")}
              className="text-xs text-[#1565c0] hover:underline"
            >
              Ver todos
            </button>
          </div>

          <div className="space-y-3">
            {expedientes.map((a) => (
              <div
                key={a.m}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 cursor-pointer"
                onClick={() => navigate("/coordinador/documentos")}
              >
                <div className="w-9 h-9 bg-[#e3f0ff] rounded-xl flex items-center justify-center font-bold text-[#1565c0] text-sm">
                  {a.n.charAt(0)}
                </div>

                <div className="flex-1">
                  <div className="text-sm font-semibold text-gray-800">
                    {a.n}
                  </div>

                  <div className="text-xs text-gray-400">
                    {a.m} · {a.c}
                  </div>
                </div>

                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    a.e === "pendiente"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-yellow-100 text-yellow-700"
                  }`}
                >
                  {a.e === "pendiente" ? "Pendiente" : "En revisión"}
                </span>

                <ChevronRight className="w-4 h-4 text-gray-400" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-5">
          Accesos rápidos del proceso
        </h3>

        <div className="grid md:grid-cols-3 xl:grid-cols-6 gap-4">
          {[
            {
              title: "Alumnos",
              subtitle: "Gestión y estados",
              icon: Users,
              path: "/coordinador/alumnos",
              style: "bg-[#0d2b5e] text-white",
            },
            {
              title: "Documentos",
              subtitle: "Validación inicial",
              icon: FileCheck,
              path: "/coordinador/documentos",
              style: "bg-white text-[#0d2b5e] border-2 border-[#0d2b5e]",
            },
            {
              title: "Asignaciones",
              subtitle: "Padrón y empresas",
              icon: ClipboardList,
              path: "/coordinador/asignaciones",
              style: "bg-blue-50 text-[#1565c0] border border-blue-200",
            },
            {
              title: "Seguimiento",
              subtitle: "Avance de prácticas",
              icon: Clock,
              path: "/coordinador/seguimiento",
              style: "bg-purple-50 text-purple-700 border border-purple-200",
            },
            {
              title: "Liberación",
              subtitle: "Cierre de expediente",
              icon: Award,
              path: "/coordinador/liberacion",
              style: "bg-green-50 text-green-700 border border-green-200",
            },
            {
              title: "Notificaciones",
              subtitle: "Pendientes críticos",
              icon: Bell,
              path: "/coordinador/notificaciones",
              style: "bg-orange-50 text-orange-700 border border-orange-200",
            },
          ].map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className={`${item.style} rounded-2xl p-5 flex flex-col items-start gap-3 hover:shadow-md transition-all text-left`}
            >
              <item.icon className="w-6 h-6" />

              <div>
                <div className="font-bold">{item.title}</div>
                <div className="text-xs opacity-70 mt-0.5">
                  {item.subtitle}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}