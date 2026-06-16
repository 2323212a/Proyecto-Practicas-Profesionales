import { useNavigate } from "react-router";
import {
  Clock,
  FileText,
  AlertCircle,
  BookOpen,
  Shield,
  Bell,
  ChevronRight,
} from "lucide-react";

export function AlumnoDashboard() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Dashboard del Alumno
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Bienvenid@, Brayan Madain — Convocatoria Verano
          2026
        </p>
      </div>

      <div className="bg-gradient-to-r from-[#0d2b5e] to-[#1565c0] rounded-2xl p-6 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="text-blue-200 text-sm mb-1">
            Estado de tu proceso
          </div>
          <div className="font-bold text-xl">
            Expediente en revisión por coordinador
          </div>
          <div className="text-blue-200 text-sm mt-1">
            Empresa: TechSoft Chiapas S.A. · Periodo: May–Ago
            2026
          </div>
        </div>
        <div className="bg-yellow-400 text-yellow-900 px-4 py-2 rounded-xl font-bold text-sm flex-shrink-0">
          En Revisión
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            l: "Estado General",
            v: "En Proceso",
            bg: "bg-blue-50",
            tc: "text-blue-600",
            d: "Expediente en revisión",
          },
          {
            l: "Horas Acumuladas",
            v: "320 / 480",
            bg: "bg-green-50",
            tc: "text-green-600",
            d: "66% completado",
          },
          {
            l: "Docs Validados",
            v: "4 / 7",
            bg: "bg-purple-50",
            tc: "text-purple-600",
            d: "3 pendientes",
          },
          {
            l: "Pendientes",
            v: "3",
            bg: "bg-orange-50",
            tc: "text-orange-600",
            d: "Requieren atención",
          },
        ].map((w) => (
          <div
            key={w.l}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
          >
            <div
              className={`w-10 h-10 ${w.bg} rounded-xl flex items-center justify-center mb-3`}
            >
              <div
                className={`w-4 h-4 rounded-full ${w.tc.replace("text-", "bg-")}`}
              />
            </div>
            <div className="text-2xl font-bold text-[#0d2b5e]">
              {w.v}
            </div>
            <div className="text-gray-500 text-sm mt-0.5">
              {w.l}
            </div>
            <div className="text-xs text-gray-400 mt-1">
              {w.d}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-[#0d2b5e]">
            Progreso de Horas Practicadas
          </h3>
          <span className="text-sm text-gray-500">
            320 de 480 horas
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
          <div
            className="bg-gradient-to-r from-[#1565c0] to-[#1976d2] h-4 rounded-full"
            style={{ width: "66.6%" }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-2">
          <span>0 hrs</span>
          <span className="text-[#1565c0] font-semibold">
            66.6% completado
          </span>
          <span>480 hrs</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">
            Accesos Rápidos
          </h3>
          <div className="space-y-3">
            {[
              
              {
                l: "Carga de Documentos",
                I: FileText,
                p: "/alumno/documentos",
                s: "3 pendientes",
                sc: "bg-orange-100 text-orange-700",
              },
              {
                l: "Notificaciones",
                I: Bell,
                p: "/alumno/notificaciones",
                s: "3 nuevas",
                sc: "bg-red-100 text-red-700",
              },
              {
                l: "Horas Acumuladas",
                I: Clock,
                p: "/alumno/horas",
                s: "320 hrs",
                sc: "bg-blue-100 text-blue-700",
              },
            ].map((item) => (
              <button
                key={item.l}
                onClick={() => navigate(item.p)}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors group"
              >
                <div className="w-9 h-9 bg-[#e3f0ff] rounded-lg flex items-center justify-center">
                  <item.I className="w-4 h-4 text-[#1565c0]" />
                </div>
                <span className="text-sm font-medium text-gray-700 flex-1 text-left">
                  {item.l}
                </span>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${item.sc}`}
                >
                  {item.s}
                </span>
                <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-gray-600" />
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0d2b5e]">
              Notificaciones Recientes
            </h3>
            <button
              onClick={() => navigate("/alumno/notificaciones")}
              className="text-xs text-[#1565c0] hover:underline"
            >
              Ver todas
            </button>
          </div>
          <div className="space-y-3">
            {[
              {
                msg: "Tu carta de presentación fue aprobada",
                time: "Hace 2 horas",
                type: "success",
              },
              {
                msg: "El reporte parcial fue rechazado — nombre incorrecto",
                time: "Hace 1 día",
                type: "error",
              },
              {
                msg: "Nuevo aviso: jornada de inducción 10 junio",
                time: "Hace 2 días",
                type: "info",
              },
            ].map((n, i) => (
              <div
                key={i}
                className={`flex gap-3 p-3 rounded-xl border ${n.type === "success" ? "bg-green-50 border-green-100" : n.type === "error" ? "bg-red-50 border-red-100" : "bg-blue-50 border-blue-100"}`}
              >
                <div
                  className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${n.type === "success" ? "bg-green-500" : n.type === "error" ? "bg-red-500" : "bg-blue-500"}`}
                />
                <div>
                  <div className="text-sm text-gray-700">
                    {n.msg}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {n.time}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}