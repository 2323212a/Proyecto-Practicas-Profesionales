import {
  FileText,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  MessageSquare,
  Eye,
} from "lucide-react";

const reportes = [
  {
    nombre: "Reporte 1",
    periodo: "01 jun - 14 jun",
    estado: "Aprobado",
    fecha: "14 jun 2026",
    observacion: "Sin observaciones.",
  },
  {
    nombre: "Reporte 2",
    periodo: "15 jun - 28 jun",
    estado: "En revisión",
    fecha: "28 jun 2026",
    observacion: "Pendiente de revisión por el asesor.",
  },
  {
    nombre: "Reporte 3",
    periodo: "29 jun - 12 jul",
    estado: "Pendiente",
    fecha: "Por entregar",
    observacion: "Aún no se ha cargado el reporte.",
  },
  {
    nombre: "Reporte Final",
    periodo: "Cierre de prácticas",
    estado: "Pendiente",
    fecha: "Por entregar",
    observacion: "Disponible al completar el periodo.",
  },
];

const estadoColor: Record<string, string> = {
  Aprobado: "bg-green-100 text-green-700",
  "En revisión": "bg-yellow-100 text-yellow-700",
  Pendiente: "bg-orange-100 text-orange-700",
};

export function AlumnoReportes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Mis Reportes
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Entrega y seguimiento de reportes durante tus prácticas profesionales.
        </p>
      </div>

      <div className="bg-[#0d2b5e] rounded-2xl p-6 text-white">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <h2 className="text-xl font-bold">
              TechSoft Chiapas
            </h2>
            <p className="text-blue-200 text-sm mt-1">
              Desarrollo Web · Periodo Verano 2026
            </p>
          </div>

          <span className="bg-yellow-100 text-yellow-700 px-4 py-2 rounded-full text-sm font-semibold w-fit">
            Prácticas en curso
          </span>
        </div>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          ["Reportes requeridos", "4", FileText, "bg-blue-600"],
          ["Aprobados", "1", CheckCircle2, "bg-green-600"],
          ["En revisión", "1", Clock, "bg-yellow-500"],
          ["Pendientes", "2", AlertTriangle, "bg-orange-500"],
        ].map(([titulo, valor, Icon, color]: any) => (
          <div key={titulo} className={`${color} rounded-2xl p-5 text-white`}>
            <Icon className="w-7 h-7 mb-3 opacity-80" />
            <div className="text-2xl font-bold">{valor}</div>
            <div className="text-white/80 text-sm">{titulo}</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {reportes.map((r) => (
            <div
              key={r.nombre}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
            >
              <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#0d2b5e]">
                    {r.nombre}
                  </h3>
                  <p className="text-sm text-gray-500 mt-1">
                    {r.periodo}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Fecha: {r.fecha}
                  </p>
                </div>

                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold w-fit ${estadoColor[r.estado]}`}
                >
                  {r.estado}
                </span>
              </div>

              <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <MessageSquare className="w-5 h-5 text-[#1565c0] mt-0.5" />
                  <p className="text-sm text-gray-600">
                    {r.observacion}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5">
                <button className="border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Ver reporte
                </button>

                {r.estado === "Pendiente" && (
                  <button className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2">
                    <Upload className="w-4 h-4" />
                    Subir reporte
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-5">
              Progreso de entregas
            </h3>

            <div className="bg-gray-200 rounded-full h-3">
              <div
                className="bg-[#1565c0] h-3 rounded-full"
                style={{ width: "50%" }}
              />
            </div>

            <p className="text-sm text-gray-500 mt-3">
              2 de 4 reportes entregados.
            </p>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
            <p className="text-sm text-[#0d2b5e]">
              Los reportes deben cargarse dentro del periodo indicado para que el asesor pueda revisarlos y registrar observaciones.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}