import { useNavigate } from "react-router";
import {
  Building2,
  FileText,
  Briefcase,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ChevronRight,
  Bell,
} from "lucide-react";

const pipeline = [
  {
    etapa: "Empresas registradas",
    cantidad: 34,
    detalle: "Solicitudes recibidas",
  },
  {
    etapa: "Documentación validada",
    cantidad: 28,
    detalle: "Expedientes correctos",
  },
  {
    etapa: "Convenios vigentes",
    cantidad: 24,
    detalle: "Empresas habilitadas",
  },
  {
    etapa: "Vacantes aprobadas",
    cantidad: 24,
    detalle: "Planes revisados",
  },
  {
    etapa: "Publicadas en padrón",
    cantidad: 24,
    detalle: "Visibles para alumnos",
  },
];

const actividad = [
  "DevSolutions Chiapas registró solicitud de alta.",
  "Innovatek envió documentación corregida.",
  "DataLab MX actualizó su convenio.",
  "TechSoft Chiapas está lista para publicarse en padrón.",
];

const alertas = [
  "Chiapas Digital tiene convenio por vencer.",
  "Innovatek mantiene observaciones en documentación.",
  "DataLab MX tiene vacantes pendientes de aprobación.",
  "DevSolutions Chiapas espera revisión inicial.",
];

export function CoordUnidadesDashboard() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Dashboard — Coordinador de Unidades Receptoras
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Seguimiento de empresas, convenios, vacantes y publicación en padrón empresarial.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          {
            label: "Empresas pendientes",
            value: "12",
            icon: Building2,
            color: "bg-orange-500",
          },
          {
            label: "Convenios por actualizar",
            value: "8",
            icon: FileText,
            color: "bg-blue-600",
          },
          {
            label: "Vacantes en revisión",
            value: "15",
            icon: Briefcase,
            color: "bg-purple-600",
          },
          {
            label: "Empresas publicadas",
            value: "24",
            icon: ClipboardList,
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
            Flujo de incorporación de empresas
          </h3>

          <div className="space-y-4">
            {pipeline.map((p, index) => (
              <div key={p.etapa} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565c0] flex items-center justify-center font-bold">
                  {index + 1}
                </div>

                <div className="flex-1 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-[#0d2b5e]">
                        {p.etapa}
                      </p>
                      <p className="text-sm text-gray-500">
                        {p.detalle}
                      </p>
                    </div>

                    <div className="text-2xl font-bold text-[#0d2b5e]">
                      {p.cantidad}
                    </div>
                  </div>
                </div>

                {index < pipeline.length - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-300 hidden md:block" />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-5 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#1565c0]" />
              Actividad reciente
            </h3>

            <div className="space-y-3">
              {actividad.map((item) => (
                <div
                  key={item}
                  className="border border-gray-200 rounded-xl p-4 text-sm text-gray-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-5 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Alertas
            </h3>

            <div className="space-y-3">
              {alertas.map((item) => (
                <div
                  key={item}
                  className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700"
                >
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-5">
          Accesos rápidos
        </h3>

        <div className="grid md:grid-cols-4 gap-4">
          {[
            {
              title: "Revisar empresas",
              subtitle: "Solicitudes y expedientes",
              icon: Building2,
              path: "/coord-unidades/empresas",
              style: "bg-[#0d2b5e] text-white",
            },
            {
              title: "Gestionar convenios",
              subtitle: "Vigencias y renovaciones",
              icon: FileText,
              path: "/coord-unidades/convenios",
              style: "bg-blue-50 text-[#1565c0] border border-blue-200",
            },
            {
              title: "Revisar vacantes",
              subtitle: "Plan de trabajo",
              icon: Briefcase,
              path: "/coord-unidades/vacantes",
              style: "bg-purple-50 text-purple-700 border border-purple-200",
            },
            {
              title: "Padrón empresarial",
              subtitle: "Empresas visibles",
              icon: ClipboardList,
              path: "/coord-unidades/padron",
              style: "bg-green-50 text-green-700 border border-green-200",
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