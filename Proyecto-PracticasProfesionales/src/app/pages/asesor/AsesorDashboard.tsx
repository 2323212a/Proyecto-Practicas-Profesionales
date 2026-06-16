import { useNavigate } from "react-router";
import {
  Users,
  FileText,
  MessageSquare,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";

const pendientes = [
  {
    alumno: "Brayan Madain Hernandez",
    empresa: "TechSoft Chiapas",
    pendiente: "Reporte 2 pendiente de revisión",
    estado: "Urgente",
  },
  {
    alumno: "Laura Martínez Cruz",
    empresa: "Chiapas Digital",
    pendiente: "Observación activa",
    estado: "Seguimiento",
  },
  {
    alumno: "Miguel Torres Flores",
    empresa: "DataLab MX",
    pendiente: "Listo para evaluación final",
    estado: "Final",
  },
   {
    alumno: "Javier Molina ",
    empresa: "TechSoft Chiapas",
    pendiente: "Reporte 2 pendiente de revisión",
    estado: "Urgente",
  },
];

const estadoColor: Record<string, string> = {
  Urgente: "bg-red-100 text-red-700",
  Seguimiento: "bg-yellow-100 text-yellow-700",
  Final: "bg-green-100 text-green-700",
};

export function AsesorDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Dashboard — Asesor Interno
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Seguimiento académico de alumnos asignados durante sus prácticas profesionales.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          {
            label: "Alumnos asignados",
            value: "12",
            icon: Users,
            color: "bg-blue-600",
          },
          {
            label: "Reportes pendientes",
            value: "5",
            icon: FileText,
            color: "bg-orange-500",
          },
          {
            label: "Observaciones activas",
            value: "3",
            icon: MessageSquare,
            color: "bg-purple-600",
          },
          {
            label: "Listos para cierre",
            value: "4",
            icon: CheckCircle2,
            color: "bg-green-600",
          },
        ].map((item) => (
          <div
            key={item.label}
            className={`${item.color} rounded-2xl p-5 text-white`}
          >
            <item.icon className="w-7 h-7 mb-3 opacity-80" />
            <div className="text-2xl font-bold">{item.value}</div>
            <div className="text-white/80 text-sm">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5">
            Pendientes de seguimiento
          </h3>

          <div className="space-y-3">
            {pendientes.map((p) => (
              <div
                key={p.alumno}
                className="border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:bg-gray-50"
              >
                <div>
                  <h4 className="font-semibold text-[#0d2b5e]">
                    {p.alumno}
                  </h4>
                  <p className="text-sm text-gray-500 mt-1">
                    {p.empresa} · {p.pendiente}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoColor[p.estado]}`}
                  >
                    {p.estado}
                  </span>

                  <button
                    onClick={() => navigate("/asesor/alumnos")}
                    className="text-[#1565c0] text-sm font-semibold flex items-center gap-1"
                  >
                    Ver
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-5">
              Próximas acciones
            </h3>

            <div className="space-y-4">
              {[
                {
                  icon: FileText,
                  text: "Revisar reportes entregados por alumnos.",
                },
                {
                  icon: MessageSquare,
                  text: "Registrar observaciones académicas.",
                },
                {
                  icon: CheckCircle2,
                  text: "Validar alumnos listos para cierre.",
                },
              ].map((a) => (
                <div
                  key={a.text}
                  className="flex items-start gap-3 text-sm text-gray-700"
                >
                  <a.icon className="w-5 h-5 text-[#1565c0] mt-0.5" />
                  <p>{a.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
              <p className="text-sm text-orange-700">
                Hay reportes pendientes de revisión. Atiéndelos antes del cierre del periodo.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-5">
          Accesos rápidos
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              title: "Alumnos asignados",
              subtitle: "Ver avance individual",
              icon: Users,
              path: "/asesor/alumnos",
              style: "bg-[#0d2b5e] text-white",
            },
            {
              title: "Reportes",
              subtitle: "Revisar entregas",
              icon: FileText,
              path: "/asesor/reportes",
              style: "bg-blue-50 text-[#1565c0] border border-blue-200",
            },
            {
              title: "Observaciones",
              subtitle: "Registrar seguimiento",
              icon: MessageSquare,
              path: "/asesor/observaciones",
              style: "bg-purple-50 text-purple-700 border border-purple-200",
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