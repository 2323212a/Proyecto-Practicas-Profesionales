import {
  Briefcase,
  Users,
  CheckCircle,
  Clock,
  FileText,
  CalendarDays,
  Target,
  ClipboardList,
  Eye,
  Plus,
} from "lucide-react";

export function PlanTrabajo() {
  const planes = [
    {
      id: 1,
      alumno: "Oscar Gonzalez",
      carrera: "Ing. Desarrollo de Software",
      proyecto: "Sistema de Gestión Documental",
      area: "Desarrollo Web",
      asesor: "Mtro. Daniel Pérez Castillo",
      inicio: "01 mayo 2026",
      fin: "31 agosto 2026",
      estado: "Aprobado",
      avance: 100,
      actividades: [
        "Análisis de requerimientos",
        "Diseño de interfaz",
        "Desarrollo de módulos",
        "Pruebas del sistema",
      ],
    },
    {
      id: 2,
      alumno: "Brayan Hernandez",
      carrera: "Ing. Desarrollo de Software",
      proyecto: "Portal de Prácticas Profesionales",
      area: "Documentación Técnica",
      asesor: "Lic. Fernanda Torres Gómez",
      inicio: "01 mayo 2026",
      fin: "31 agosto 2026",
      estado: "Aprobado",
      avance: 90,
      actividades: [
        "Levantamiento de información",
        "Organización documental",
        "Validación de procesos",
        "Elaboración de reportes",
      ],
    },
    {
      id: 3,
      alumno: "Javier Molina",
      carrera: "Inteligencia Artificial",
      proyecto: "Análisis de Datos Empresariales",
      area: "Análisis de Datos",
      asesor: "Ing. Alejandro Méndez Ruiz",
      inicio: "10 mayo 2026",
      fin: "31 agosto 2026",
      estado: "En revisión",
      avance: 51,
      actividades: [
        "Limpieza de datos",
        "Creación de reportes",
        "Visualización de información",
        "Presentación de resultados",
      ],
    },
  ];

  const estadoColor: Record<string, string> = {
    Aprobado: "bg-green-100 text-green-700",
    "En revisión": "bg-yellow-100 text-yellow-700",
    Pendiente: "bg-gray-100 text-gray-600",
  };

  const totalAprobados = planes.filter((p) => p.estado === "Aprobado").length;
  const enRevision = planes.filter((p) => p.estado === "En revisión").length;
  const avancePromedio = Math.round(
    planes.reduce((acc, p) => acc + p.avance, 0) / planes.length,
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Plan de Trabajo
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Seguimiento de actividades, proyectos y responsabilidades asignadas a
          los alumnos en prácticas.
        </p>
      </div>

      <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="font-bold text-xl">
            Planes de trabajo de la unidad receptora
          </div>
          <div className="text-purple-100 text-sm mt-1">
            TechSoft Chiapas S.A. de C.V. · Periodo Mayo–Agosto 2026
          </div>
        </div>

        <button className="bg-white/20 px-4 py-2 rounded-xl text-white font-bold text-sm flex items-center gap-2 hover:bg-white/30 transition-colors">
          <Plus className="w-4 h-4" />
          Nuevo Plan
        </button>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {[
          {
            label: "Planes registrados",
            value: planes.length,
            icon: Briefcase,
            color: "bg-purple-50 text-purple-600",
          },
          {
            label: "Aprobados",
            value: totalAprobados,
            icon: CheckCircle,
            color: "bg-green-50 text-green-600",
          },
          {
            label: "En revisión",
            value: enRevision,
            icon: Clock,
            color: "bg-yellow-50 text-yellow-600",
          },
          {
            label: "Avance promedio",
            value: `${avancePromedio}%`,
            icon: Target,
            color: "bg-blue-50 text-blue-600",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
          >
            <div
              className={`w-10 h-10 ${item.color} rounded-xl flex items-center justify-center mb-3`}
            >
              <item.icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-[#0d2b5e]">
              {item.value}
            </div>
            <div className="text-gray-500 text-sm mt-0.5">{item.label}</div>
          </div>
        ))}
      </div>

      <div className="grid xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e]">
              Planes de Trabajo Registrados
            </h3>
          </div>

          <div className="divide-y divide-gray-100">
            {planes.map((p) => (
              <div key={p.id} className="px-6 py-5 hover:bg-gray-50">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <h4 className="font-bold text-gray-800 text-sm">
                        {p.proyecto}
                      </h4>
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${
                          estadoColor[p.estado]
                        }`}
                      >
                        {p.estado}
                      </span>
                    </div>

                    <div className="text-sm text-gray-600">
                      {p.alumno}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {p.carrera} · Área: {p.area}
                    </div>

                    <div className="grid sm:grid-cols-2 gap-3 mt-4">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Users className="w-4 h-4 text-[#1565c0]" />
                        Asesor: {p.asesor}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <CalendarDays className="w-4 h-4 text-[#1565c0]" />
                        {p.inicio} — {p.fin}
                      </div>
                    </div>

                    <div className="mt-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">
                          Avance del plan
                        </span>
                        <span className="text-xs font-semibold text-[#1565c0]">
                          {p.avance}%
                        </span>
                      </div>

                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-[#1565c0] h-2 rounded-full"
                          style={{ width: `${p.avance}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0d2b5e] text-white rounded-lg text-xs font-semibold hover:bg-[#1565c0] transition-colors">
                    <Eye className="w-3.5 h-3.5" />
                    Ver detalle
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-4">
              Actividades del Plan
            </h3>

            <div className="space-y-4">
              {planes[0].actividades.map((a, index) => (
                <div key={a} className="flex items-start gap-3">
                  <div
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      index < 3
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-500"
                    }`}
                  >
                    {index + 1}
                  </div>

                  <div>
                    <div className="text-sm font-semibold text-gray-800">
                      {a}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {index < 3 ? "Completado" : "Pendiente"}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-4">
              Documentos Asociados
            </h3>

            <div className="space-y-3">
              {[
                "Plan de trabajo firmado",
                "Carta de aceptación",
                "Cronograma de actividades",
                "Reporte parcial",
              ].map((doc, index) => (
                <div
                  key={doc}
                  className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4 text-[#1565c0]" />
                    <span className="text-sm text-gray-700">{doc}</span>
                  </div>

                  <span
                    className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                      index < 3
                        ? "bg-green-100 text-green-700"
                        : "bg-yellow-100 text-yellow-700"
                    }`}
                  >
                    {index < 3 ? "Recibido" : "Pendiente"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-4">
          Objetivo General del Plan de Trabajo
        </h3>

        <p className="text-sm text-gray-600 leading-relaxed">
          El plan de trabajo tiene como propósito organizar las actividades que
          realizará el alumno dentro de la unidad receptora, definiendo
          objetivos, responsabilidades, fechas de seguimiento y entregables
          relacionados con el desarrollo de sus prácticas profesionales. Este
          documento permite dar seguimiento al avance del estudiante y asegurar
          que las actividades correspondan con su perfil académico.
        </p>
      </div>
    </div>
  );
}