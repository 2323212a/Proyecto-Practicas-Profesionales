import {
  Search,
  MessageSquare,
  Eye,
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileText,
} from "lucide-react";

const alumnosSeguimiento = [
  {
    alumno: "Ana González Ruiz",
    carrera: "Arquitectura de Sistemas IA",
    empresa: "TechSoft Chiapas",
    periodo: "Jun - Ago 2026",
    reportes: "4/5",
    horas: "320/480",
    avance: 67,
    estado: "Al corriente",
  },
  {
    alumno: "Brayan Madain Hernandez",
    carrera: "Desarrollo y Tec. Software",
    empresa: "Innovatek",
    periodo: "Jun - Ago 2026",
    reportes: "3/5",
    horas: "260/480",
    avance: 54,
    estado: "Con observaciones",
  },
  {
    alumno: "Laura Martínez Cruz",
    carrera: "Sistemas Computacionales",
    empresa: "Chiapas Digital",
    periodo: "Jun - Ago 2026",
    reportes: "2/5",
    horas: "180/480",
    avance: 38,
    estado: "Requiere seguimiento",
  },
  {
    alumno: "Miguel Torres Flores",
    carrera: "IA y Ciencia de Datos",
    empresa: "DataLab MX",
    periodo: "Jun - Ago 2026",
    reportes: "5/5",
    horas: "480/480",
    avance: 100,
    estado: "Listo para liberación",
  },
];

const estadoColor: Record<string, string> = {
  "Al corriente": "bg-green-100 text-green-700",
  "Con observaciones": "bg-orange-100 text-orange-700",
  "Requiere seguimiento": "bg-red-100 text-red-700",
  "Listo para liberación": "bg-blue-100 text-blue-700",
};

export function CoordinadorSeguimiento() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Seguimiento de Prácticas
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Revisión del avance de alumnos durante su estancia en la unidad receptora.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="grid md:grid-cols-4 gap-4">
          <select className="border rounded-xl px-3 py-2 text-sm">
            <option>Convocatoria Verano 2026</option>
            <option>Primavera 2026</option>
          </select>

          <select className="border rounded-xl px-3 py-2 text-sm">
            <option>Todos los estados</option>
            <option>Al corriente</option>
            <option>Con observaciones</option>
            <option>Requiere seguimiento</option>
            <option>Listo para liberación</option>
          </select>

          <select className="border rounded-xl px-3 py-2 text-sm">
            <option>Todas las empresas</option>
            <option>TechSoft Chiapas</option>
            <option>Innovatek</option>
            <option>DataLab MX</option>
          </select>

          <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              className="outline-none text-sm w-full"
              placeholder="Buscar alumno..."
            />
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {alumnosSeguimiento.map((a) => (
            <div
              key={a.alumno}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
            >
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#0d2b5e]">
                    {a.alumno}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {a.carrera} · {a.empresa}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Periodo: {a.periodo}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${estadoColor[a.estado]}`}
                >
                  {a.estado}
                </span>
              </div>

              <div className="grid md:grid-cols-3 gap-4 mt-5">
                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <Clock className="w-4 h-4" />
                    Horas registradas
                  </div>
                  <p className="font-bold text-[#0d2b5e] mt-2">
                    {a.horas}
                  </p>
                </div>

                <div className="border rounded-xl p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-xs">
                    <FileText className="w-4 h-4" />
                    Reportes entregados
                  </div>
                  <p className="font-bold text-[#0d2b5e] mt-2">
                    {a.reportes}
                  </p>
                </div>

                <div className="border rounded-xl p-4">
                  <div className="text-gray-500 text-xs">
                    Avance general
                  </div>
                  <div className="mt-3 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-[#1565c0] h-2 rounded-full"
                      style={{ width: `${a.avance}%` }}
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {a.avance}% completado
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <button className="border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Ver expediente
                </button>

                <button className="border border-orange-200 text-orange-600 rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Registrar observación
                </button>

                {a.estado === "Listo para liberación" && (
                  <button className="bg-green-600 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Enviar a liberación
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-5">
              Pendientes de atención
            </h3>

            <div className="space-y-4">
              {[
                "Laura Martínez requiere seguimiento por reporte pendiente.",
                "Brayan Madain tiene observación registrada por la empresa.",
                "Miguel Torres está listo para pasar a liberación.",
              ].map((item) => (
                <div
                  key={item}
                  className="border border-orange-200 bg-orange-50 rounded-xl p-4 flex gap-3"
                >
                  <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
                  <p className="text-sm text-orange-700">
                    {item}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-5">
              Acciones rápidas
            </h3>

            <div className="space-y-3">
              <button className="w-full bg-[#1565c0] text-white rounded-xl py-2 text-sm font-semibold">
                Registrar seguimiento
              </button>

              <button className="w-full border border-blue-200 text-[#1565c0] rounded-xl py-2 text-sm font-semibold">
                Revisar reportes pendientes
              </button>

              <button className="w-full border border-orange-200 text-orange-600 rounded-xl py-2 text-sm font-semibold">
                Ver incidencias abiertas
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}