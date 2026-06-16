import {
  MessageSquare,
  Search,
  CheckCircle2,
  Plus,
  Eye,
  AlertTriangle,
} from "lucide-react";

const observaciones = [
  {
    alumno: "Brayan Madain Hernandez",
    empresa: "TechSoft Chiapas",
    fecha: "28 jun 2026",
    tipo: "Académica",
    estado: "Abierta",
    prioridad: "Alta",
    detalle:
      "Debe ampliar la descripción de actividades realizadas en el reporte 2.",
  },
  {
    alumno: "Javier Molina",
    empresa: "TechSoft Chiapas",
    fecha: "29 jun 2026",
    tipo: "Seguimiento",
    estado: "En seguimiento",
    prioridad: "Media",
    detalle:
      "Se encuentra realizando actividades conforme al plan de trabajo y ha entregado 2 de 5 reportes requeridos.",
  },
  {
    alumno: "Laura Martínez Cruz",
    empresa: "Chiapas Digital",
    fecha: "27 jun 2026",
    tipo: "Seguimiento",
    estado: "En seguimiento",
    prioridad: "Media",
    detalle:
      "La empresa reporta retraso en la entrega del reporte parcial.",
  },
  {
    alumno: "Miguel Torres Flores",
    empresa: "DataLab MX",
    fecha: "25 jun 2026",
    tipo: "Cierre",
    estado: "Resuelta",
    prioridad: "Baja",
    detalle:
      "Reporte final revisado y aprobado para cierre del proceso.",
  },
];

const estadoColor: Record<string, string> = {
  Abierta: "bg-red-100 text-red-700",
  "En seguimiento": "bg-yellow-100 text-yellow-700",
  Resuelta: "bg-green-100 text-green-700",
};

const prioridadColor: Record<string, string> = {
  Alta: "bg-red-50 text-red-700 border-red-200",
  Media: "bg-yellow-50 text-yellow-700 border-yellow-200",
  Baja: "bg-gray-50 text-gray-600 border-gray-200",
};

export function AsesorObservaciones() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">
            Observaciones
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Bitácora de seguimiento académico registrada por el asesor interno.
          </p>
        </div>

        <button className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Nueva observación
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2 md:col-span-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              className="outline-none text-sm w-full"
              placeholder="Buscar por alumno, empresa o detalle..."
            />
          </div>

          <select className="border rounded-xl px-3 py-2 text-sm">
            <option>Todos los estados</option>
            <option>Abierta</option>
            <option>En seguimiento</option>
            <option>Resuelta</option>
          </select>

          <select className="border rounded-xl px-3 py-2 text-sm">
            <option>Todas las prioridades</option>
            <option>Alta</option>
            <option>Media</option>
            <option>Baja</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">
            Bitácora de observaciones
          </h3>
          <span className="ml-auto text-xs text-gray-400">
            {observaciones.length} registros
          </span>
        </div>

        <div className="divide-y divide-gray-100">
          {observaciones.map((o) => (
            <div
              key={`${o.alumno}-${o.fecha}`}
              className="p-5 hover:bg-gray-50"
            >
              <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
                <div className="flex gap-4">
                  <div className="w-11 h-11 rounded-xl bg-blue-50 text-[#1565c0] flex items-center justify-center font-bold">
                    {o.alumno.charAt(0)}
                  </div>

                  <div>
                    <h4 className="font-bold text-[#0d2b5e]">
                      {o.alumno}
                    </h4>

                    <p className="text-sm text-gray-500 mt-1">
                      {o.empresa} · {o.tipo} · {o.fecha}
                    </p>

                    <p className="text-sm text-gray-700 mt-3">
                      {o.detalle}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold border ${prioridadColor[o.prioridad]}`}
                  >
                    Prioridad {o.prioridad}
                  </span>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoColor[o.estado]}`}
                  >
                    {o.estado}
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-5 pl-0 xl:pl-15">
                <button className="border border-blue-200 text-[#1565c0] rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2">
                  <Eye className="w-4 h-4" />
                  Ver seguimiento
                </button>

                {o.estado !== "Resuelta" && (
                  <button className="bg-green-600 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    Marcar resuelta
                  </button>
                )}

                {o.prioridad === "Alta" && (
                  <button className="border border-orange-200 text-orange-600 rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Notificar coordinación
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}