import {
  Search,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Eye,
  Send,
} from "lucide-react";

import { useNavigate } from "react-router";



const empresas = [
  {
    nombre: "DevSolutions Chiapas",
    tipo: "Nueva afiliación",
    responsable: "Ing. Marco Flores",
    correo: "marco@dev.mx",
    convenio: "Pendiente",
    vacantes: 3,
    estado: "Pendiente",
    padron: "No publicado",
    fecha: "03 jun 2026",
  },
  {
    nombre: "TechSoft Chiapas",
    tipo: "Renovación",
    responsable: "Lic. Gabriela Reyes",
    correo: "gaby@techsoft.mx",
    convenio: "Vigente",
    vacantes: 5,
    estado: "Aprobada",
    padron: "Publicado",
    fecha: "28 may 2026",
  },
  {
    nombre: "Innovatek",
    tipo: "Renovación",
    responsable: "C.P. Jorge Méndez",
    correo: "jorge@innovatek.mx",
    convenio: "Vence en 15 días",
    vacantes: 4,
    estado: "En revisión",
    padron: "No publicado",
    fecha: "25 may 2026",
  },
  {
    nombre: "DataLab MX",
    tipo: "Nueva afiliación",
    responsable: "Mtra. Ana Ruiz",
    correo: "ana@datalab.mx",
    convenio: "Pendiente",
    vacantes: 6,
    estado: "Corrección",
    padron: "No publicado",
    fecha: "22 may 2026",
  },
];

const estadoColor: Record<string, string> = {
  Pendiente: "bg-orange-100 text-orange-700",
  Aprobada: "bg-green-100 text-green-700",
  "En revisión": "bg-yellow-100 text-yellow-700",
  Corrección: "bg-red-100 text-red-700",
};

const padronColor: Record<string, string> = {
  Publicado: "bg-green-100 text-green-700",
  "No publicado": "bg-gray-100 text-gray-600",
};

export function ValidacionEmpresas() {
  const navigate = useNavigate();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Gestión de Empresas
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Revisión de empresas nuevas, renovaciones, documentación, convenios y padrón empresarial.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          ["Pendientes", "12", Clock, "bg-orange-500"],
          ["Aprobadas", "34", CheckCircle2, "bg-green-600"],
          ["Con correcciones", "6", AlertTriangle, "bg-red-500"],
          ["Renovaciones", "8", FileText, "bg-blue-600"],
        ].map(([titulo, valor, Icon, color]: any) => (
          <div key={titulo} className={`${color} rounded-2xl p-5 text-white`}>
            <Icon className="w-7 h-7 mb-3 opacity-80" />
            <div className="text-2xl font-bold">{valor}</div>
            <div className="text-white/80 text-sm">{titulo}</div>
          </div>
        ))}
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
            <option>Todos los tipos</option>
            <option>Nueva afiliación</option>
            <option>Renovación</option>
          </select>

          <select className="border rounded-xl px-3 py-2 text-sm">
            <option>Todos los estados</option>
            <option>Pendiente</option>
            <option>En revisión</option>
            <option>Corrección</option>
            <option>Aprobada</option>
          </select>

          <select className="border rounded-xl px-3 py-2 text-sm">
            <option>Estado en padrón</option>
            <option>Publicado</option>
            <option>No publicado</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">
            Empresas registradas
          </h3>
          <span className="ml-auto text-xs text-gray-400">
            {empresas.length} resultados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3">Empresa</th>
                <th>Tipo</th>
                <th>Convenio</th>
                <th>Vacantes</th>
                <th>Estado</th>
                <th>Padrón</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {empresas.map((e) => (
                <tr key={e.nombre} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#0d2b5e]">
                      {e.nombre}
                    </div>
                    <div className="text-xs text-gray-400">
                      {e.responsable} · {e.correo}
                    </div>
                  </td>

                  <td className="text-gray-600">{e.tipo}</td>

                  <td>
                    <span className="text-xs bg-blue-50 text-[#1565c0] px-3 py-1 rounded-full">
                      {e.convenio}
                    </span>
                  </td>

                  <td className="text-gray-600">
                    {e.vacantes} vacantes
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
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${padronColor[e.padron]}`}
                    >
                      {e.padron}
                    </span>
                  </td>

                  <td>
                    <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => navigate("/coord-unidades/empresas/expediente")}
                          className="border border-blue-200 text-[#1565c0] rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Ver expediente
                        </button>

                      {e.estado === "Aprobada" && e.padron === "No publicado" && (
                        <button className="bg-green-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                          <Send className="w-3 h-3" />
                          Publicar
                        </button>
                      )}

                      {e.estado !== "Aprobada" && (
                        <button className="border border-orange-200 text-orange-600 rounded-lg px-3 py-1.5 text-xs font-semibold">
                          Revisar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <p className="text-sm text-[#0d2b5e]">
          Una empresa solo puede publicarse en el padrón cuando su documentación, convenio, plan de trabajo y vacantes han sido revisados.
        </p>
      </div>
    </div>
  );
}