import {
  Building2,
  Search,
  Eye,
  Send,
  EyeOff,
  CheckCircle2,
  AlertTriangle,
  Users,
  Globe2,
} from "lucide-react";

const empresasPadron = [
  {
    empresa: "TechSoft Chiapas",
    giro: "Desarrollo web",
    requisitos: "Completos",
    vacantes: 6,
    estado: "Publicada",
    visibilidad: "Visible",
    observacion: "Disponible para selección de alumnos.",
  },
  {
    empresa: "DataLab MX",
    giro: "Análisis de datos",
    requisitos: "Completos",
    vacantes: 4,
    estado: "Lista para publicar",
    visibilidad: "Oculta",
    observacion: "Lista para mostrarse en el catálogo.",
  },
  {
    empresa: "Innovatek",
    giro: "Software empresarial",
    requisitos: "Pendientes",
    vacantes: 3,
    estado: "No publicable",
    visibilidad: "Oculta",
    observacion: "Convenio próximo a vencer. Revisar antes de publicar.",
  },
  {
    empresa: "Chiapas Digital",
    giro: "Soporte tecnológico",
    requisitos: "Completos",
    vacantes: 5,
    estado: "Publicada",
    visibilidad: "Visible",
    observacion: "Disponible para selección de alumnos.",
  },
];

const estadoColor: Record<string, string> = {
  Publicada: "bg-green-100 text-green-700",
  "Lista para publicar": "bg-blue-100 text-blue-700",
  "No publicable": "bg-orange-100 text-orange-700",
};

const requisitoColor: Record<string, string> = {
  Completos: "bg-green-100 text-green-700",
  Pendientes: "bg-orange-100 text-orange-700",
};

export function PadronEmpresarial() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">
            Padrón Empresarial
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Control de empresas visibles para alumnos dentro del catálogo de unidades receptoras.
          </p>
        </div>

        <button className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
          <Send className="w-4 h-4" />
          Publicar cambios
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              className="outline-none text-sm w-full"
              placeholder="Buscar empresa..."
            />
          </div>

          <select className="border rounded-xl px-3 py-2 text-sm">
            <option>Todos los estados</option>
            <option>Publicada</option>
            <option>Lista para publicar</option>
            <option>No publicable</option>
          </select>

          <select className="border rounded-xl px-3 py-2 text-sm">
            <option>Requisitos</option>
            <option>Completos</option>
            <option>Pendientes</option>
          </select>

          <select className="border rounded-xl px-3 py-2 text-sm">
            <option>Visibilidad</option>
            <option>Visible</option>
            <option>Oculta</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <Globe2 className="w-6 h-6 text-green-700" />
            <div>
              <p className="text-2xl font-bold text-green-700">24</p>
              <p className="text-sm text-green-700">Empresas visibles</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-blue-700" />
            <div>
              <p className="text-2xl font-bold text-blue-700">8</p>
              <p className="text-sm text-blue-700">Listas para publicar</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-700" />
            <div>
              <p className="text-2xl font-bold text-orange-700">6</p>
              <p className="text-sm text-orange-700">No publicables</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">
            Empresas en padrón
          </h3>
          <span className="ml-auto text-xs text-gray-400">
            {empresasPadron.length} resultados
          </span>
        </div>

        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr className="text-left text-gray-500">
              <th className="px-6 py-3">Empresa</th>
              <th>Requisitos</th>
              <th>Vacantes</th>
              <th>Estado</th>
              <th>Visibilidad</th>
              <th>Observación</th>
              <th>Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-100">
            {empresasPadron.map((e) => (
              <tr key={e.empresa} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div className="font-medium text-[#0d2b5e]">
                    {e.empresa}
                  </div>
                  <div className="text-xs text-gray-400">
                    {e.giro}
                  </div>
                </td>

                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${requisitoColor[e.requisitos]}`}
                  >
                    {e.requisitos}
                  </span>
                </td>

                <td className="text-gray-600">
                  {e.vacantes} espacios
                </td>

                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoColor[e.estado]}`}
                  >
                    {e.estado}
                  </span>
                </td>

                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      e.visibilidad === "Visible"
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {e.visibilidad}
                  </span>
                </td>

                <td className="text-gray-600 max-w-xs">
                  {e.observacion}
                </td>

                <td>
                  <div className="flex flex-wrap gap-2">
                    <button className="border border-blue-200 text-[#1565c0] rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      Vista alumno
                    </button>

                    {e.estado === "Lista para publicar" && (
                      <button className="bg-green-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                        <Send className="w-3 h-3" />
                        Publicar
                      </button>
                    )}

                    {e.visibilidad === "Visible" && (
                      <button className="border border-orange-200 text-orange-600 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                        <EyeOff className="w-3 h-3" />
                        Ocultar
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-[#1565c0] mt-0.5" />
          <p className="text-sm text-[#0d2b5e]">
            El padrón empresarial funciona como catálogo final para alumnos. Solo deben aparecer empresas aprobadas y con vacantes activas.
          </p>
        </div>
      </div>
    </div>
  );
}