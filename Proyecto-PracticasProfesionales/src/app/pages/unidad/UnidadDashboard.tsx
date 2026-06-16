import { useNavigate } from "react-router";
import {
  Users,
  Briefcase,
  FileText,
  Clock,
  Star,
  ChevronRight,
  CalendarDays,
  CheckCircle,
} from "lucide-react";

export function UnidadDashboard() {
  const navigate = useNavigate();

  const alumnos = [
    { n: "María García López", c: "Ing. Sistemas", h: 320, m: 480 },
    { n: "Juan Pérez Núñez", c: "Ing. Sistemas", h: 280, m: 480 },
    { n: "Rosa Díaz Morales", c: "Administración", h: 400, m: 480 },
    { n: "Oscar Gonzalez", c: "Ing. Desarrollo de Software", h: 360, m: 480 },
    { n: "Brayan Hernandez", c: "Ing. Desarrollo de Software", h: 440, m: 480 },
    { n: "Javier Molina", c: "Inteligencia Artificial", h: 150, m: 480 },
  ];

  const planesTrabajo = [
    {
      alumno: "Oscar Gonzalez",
      proyecto: "Sistema de Gestión Documental",
      estado: "Activo",
    },
    {
      alumno: "Brayan Hernandez",
      proyecto: "Portal de Prácticas Profesionales",
      estado: "Activo",
    },
    {
      alumno: "Javier Molina",
      proyecto: "Análisis de Datos Empresariales",
      estado: "Pendiente",
    },
  ];

  const actividades = [
    {
      titulo: "Entrega de reporte parcial",
      fecha: "15 de junio de 2026",
      color: "bg-blue-50 text-blue-700",
    },
    {
      titulo: "Evaluación mensual",
      fecha: "20 de junio de 2026",
      color: "bg-green-50 text-green-700",
    },
    {
      titulo: "Revisión de planes de trabajo",
      fecha: "28 de junio de 2026",
      color: "bg-orange-50 text-orange-700",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Dashboard — Unidad Receptora
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          TechSoft Chiapas S.A. de C.V. · Empresa Certificada UNACH
        </p>
      </div>

      <div className="bg-gradient-to-r from-green-600 to-green-500 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="font-bold text-xl">Empresa activa y certificada</div>
          <div className="text-green-100 text-sm mt-1">
            Convenio vigente hasta: 31 dic 2026 · Folio: UN-2024-0089
          </div>
        </div>

        <div className="bg-white/20 px-4 py-2 rounded-xl">
          <div className="text-white font-bold text-sm">ACTIVA</div>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            l: "Alumnos activos",
            v: "6",
            I: Users,
            c: "bg-blue-50 text-blue-600",
          },
          {
            l: "Planes de Trabajo",
            v: "3",
            I: Briefcase,
            c: "bg-purple-50 text-purple-600",
          },
          {
            l: "Convenios vigentes",
            v: "1",
            I: FileText,
            c: "bg-green-50 text-green-600",
          },
          {
            l: "Horas registradas",
            v: "1,950",
            I: Clock,
            c: "bg-orange-50 text-orange-600",
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
            <div className="text-2xl font-bold text-[#0d2b5e]">{w.v}</div>
            <div className="text-gray-500 text-sm mt-0.5">{w.l}</div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-[#0d2b5e]">
              Alumnos en Prácticas
            </h3>
            <span className="text-xs bg-blue-100 text-blue-700 px-3 py-1 rounded-full font-semibold">
              {alumnos.length} activos
            </span>
          </div>

          <div className="space-y-3">
            {alumnos.map((a) => (
              <div
                key={a.n}
                className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <div className="font-medium text-sm text-gray-800">
                      {a.n}
                    </div>
                    <div className="text-xs text-gray-400">{a.c}</div>
                  </div>
                  <div className="text-xs text-gray-500">
                    {a.h}/{a.m} hrs
                  </div>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-[#1565c0] h-2 rounded-full"
                    style={{ width: `${(a.h / a.m) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-4">
              Evaluaciones Pendientes
            </h3>

            <div className="space-y-3">
              {[
                "María García López",
                "Juan Pérez Núñez",
                "Oscar Gonzalez",
                "Brayan Hernandez",
              ].map((n) => (
                <div
                  key={n}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <Star className="w-4 h-4 text-yellow-500" />
                    <span className="text-sm text-gray-700">{n}</span>
                  </div>

                  <button className="text-xs bg-[#0d2b5e] text-white px-3 py-1.5 rounded-lg hover:bg-[#1565c0] font-medium">
                    Evaluar
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-4">
              Acciones Rápidas
            </h3>

            <div className="space-y-2">
              {[
                {
                  l: "Actualizar perfil de empresa",
                  p: "/unidad/perfil",
                },
                {
                  l: "Consultar plan de trabajo",
                  p: "/unidad/plan-trabajo",
                },
                {
                  l: "Ver convenios",
                  p: "/unidad/convenios",
                },
              ].map((i) => (
                <button
                  key={i.l}
                  onClick={() => navigate(i.p)}
                  className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-blue-50 group transition-colors"
                >
                  <span className="text-sm text-gray-700 group-hover:text-[#1565c0]">
                    {i.l}
                  </span>
                  <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-[#1565c0]" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">
            Planes de Trabajo Activos
          </h3>

          <div className="space-y-3">
            {planesTrabajo.map((p) => (
              <div
                key={p.alumno}
                className="p-4 rounded-xl border border-gray-100 hover:bg-gray-50"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold text-sm text-gray-800">
                      {p.alumno}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {p.proyecto}
                    </div>
                  </div>

                  <span
                    className={`text-xs px-3 py-1 rounded-full font-semibold ${
                      p.estado === "Activo"
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {p.estado}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">
            Próximas Actividades
          </h3>

          <div className="space-y-3">
            {actividades.map((a) => (
              <div
                key={a.titulo}
                className={`p-4 rounded-xl flex items-center gap-3 ${a.color}`}
              >
                <CalendarDays className="w-5 h-5 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-sm">{a.titulo}</div>
                  <div className="text-xs opacity-80 mt-0.5">{a.fecha}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-4">
          Estado General del Proceso
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          {[
            {
              titulo: "Documentación recibida",
              desc: "6 expedientes vinculados a la unidad receptora.",
            },
            {
              titulo: "Planes revisados",
              desc: "2 planes de trabajo aprobados por coordinación.",
            },
            {
              titulo: "Evaluaciones en curso",
              desc: "4 evaluaciones pendientes de captura mensual.",
            },
          ].map((item) => (
            <div
              key={item.titulo}
              className="p-4 rounded-xl bg-gray-50 border border-gray-100"
            >
              <CheckCircle className="w-5 h-5 text-green-600 mb-2" />
              <div className="font-semibold text-sm text-gray-800">
                {item.titulo}
              </div>
              <div className="text-xs text-gray-500 mt-1 leading-relaxed">
                {item.desc}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}