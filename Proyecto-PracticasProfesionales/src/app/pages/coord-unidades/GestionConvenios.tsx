import { useMemo, useState } from "react";
import {
  FileText,
  Search,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Eye,
  RefreshCcw,
  Download,
  Upload,
  Filter,
  RotateCcw,
  Building2,
  CalendarDays,
} from "lucide-react";

const convenios = [
  {
    empresa: "TechSoft Chiapas",
    tipo: "Convenio vigente",
    inicio: "01 ene 2026",
    fin: "31 dic 2026",
    estado: "Vigente",
    responsable: "Lic. Gabriela Reyes",
    diasRestantes: 210,
    documento: "convenio_techsoft_2026.pdf",
  },
  {
    empresa: "Innovatek",
    tipo: "Renovación",
    inicio: "15 jun 2025",
    fin: "15 jun 2026",
    estado: "Por vencer",
    responsable: "C.P. Jorge Méndez",
    diasRestantes: 12,
    documento: "convenio_innovatek_2025.pdf",
  },
  {
    empresa: "DataLab MX",
    tipo: "Nuevo convenio",
    inicio: "Pendiente",
    fin: "Pendiente",
    estado: "Pendiente",
    responsable: "Mtra. Ana Ruiz",
    diasRestantes: 0,
    documento: "Sin documento",
  },
  {
    empresa: "Chiapas Digital",
    tipo: "Convenio vencido",
    inicio: "01 ene 2025",
    fin: "31 may 2026",
    estado: "Vencido",
    responsable: "Ing. Carlos Gómez",
    diasRestantes: -5,
    documento: "convenio_chiapas_digital_2025.pdf",
  },
];

const estadoColor: Record<string, string> = {
  Vigente: "bg-green-100 text-green-700",
  "Por vencer": "bg-yellow-100 text-yellow-700",
  Pendiente: "bg-orange-100 text-orange-700",
  Vencido: "bg-red-100 text-red-700",
};

export function GestionConvenios() {
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [tipo, setTipo] = useState("Todos");

  const filtrados = useMemo(() => {
    return convenios.filter((c) => {
      const coincideBusqueda =
        c.empresa.toLowerCase().includes(busqueda.toLowerCase()) ||
        c.responsable.toLowerCase().includes(busqueda.toLowerCase());

      const coincideEstado = estado === "Todos" || c.estado === estado;
      const coincideTipo = tipo === "Todos" || c.tipo === tipo;

      return coincideBusqueda && coincideEstado && coincideTipo;
    });
  }, [busqueda, estado, tipo]);

  const limpiarFiltros = () => {
    setBusqueda("");
    setEstado("Todos");
    setTipo("Todos");
  };

  const resumen = {
    vigentes: convenios.filter((c) => c.estado === "Vigente").length,
    porVencer: convenios.filter((c) => c.estado === "Por vencer").length,
    pendientes: convenios.filter((c) => c.estado === "Pendiente").length,
    vencidos: convenios.filter((c) => c.estado === "Vencido").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Gestión de Convenios
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Control de vigencias, documentos y renovación de convenios con unidades
          receptoras.
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          ["Vigentes", resumen.vigentes, CheckCircle2],
          ["Por vencer", resumen.porVencer, Clock],
          ["Pendientes", resumen.pendientes, AlertTriangle],
          ["Vencidos", resumen.vencidos, XCircle],
        ].map(([titulo, valor, Icon]: any) => (
          <div
            key={titulo}
            className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0d2b5e]">{valor}</div>
              <div className="text-xs text-gray-500">{titulo}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e] text-sm">
              Filtros de convenios
            </h3>
          </div>

          <button
            onClick={limpiarFiltros}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1565c0]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="outline-none text-sm w-full"
              placeholder="Buscar empresa o responsable..."
            />
          </div>

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Todos</option>
            <option>Vigente</option>
            <option>Por vencer</option>
            <option>Pendiente</option>
            <option>Vencido</option>
          </select>

          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Todos</option>
            <option>Nuevo convenio</option>
            <option>Renovación</option>
            <option>Convenio vigente</option>
            <option>Convenio vencido</option>
          </select>

          <button className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2">
            <Upload className="w-4 h-4" />
            Registrar convenio
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">
            Convenios registrados
          </h3>
          <span className="ml-auto text-xs text-gray-400">
            {filtrados.length} resultados
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3">Empresa</th>
                <th>Tipo</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th>Responsable</th>
                <th>Documento</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filtrados.map((c) => (
                <tr key={c.empresa} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#0d2b5e] flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#1565c0]" />
                      {c.empresa}
                    </div>
                  </td>

                  <td className="text-gray-600">{c.tipo}</td>

                  <td className="text-gray-600">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                      {c.inicio} — {c.fin}
                    </div>
                    {c.estado === "Por vencer" && (
                      <div className="text-xs text-yellow-700 mt-1">
                        Vence en {c.diasRestantes} días
                      </div>
                    )}
                    {c.estado === "Vencido" && (
                      <div className="text-xs text-red-700 mt-1">
                        Vencido hace {Math.abs(c.diasRestantes)} días
                      </div>
                    )}
                  </td>

                  <td>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoColor[c.estado]}`}
                    >
                      {c.estado}
                    </span>
                  </td>

                  <td className="text-gray-600">{c.responsable}</td>

                  <td className="text-gray-500 text-xs">{c.documento}</td>

                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button className="border border-blue-200 text-[#1565c0] rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Ver
                      </button>

                      <button className="border border-purple-200 text-purple-600 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                        <RefreshCcw className="w-3 h-3" />
                        Renovar
                      </button>

                      <button
                        disabled={c.documento === "Sin documento"}
                        className="border border-green-200 text-green-700 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Download className="w-3 h-3" />
                        PDF
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filtrados.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    No se encontraron convenios con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
        <p className="text-sm text-orange-700">
          Una empresa solo debe permanecer disponible en el padrón cuando cuenta
          con convenio vigente, documentación validada y vacantes activas.
        </p>
      </div>
    </div>
  );
}