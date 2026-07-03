import { useMemo, useState } from "react";
import {
  FileText,
  Download,
  Users,
  Building2,
  Briefcase,
  AlertTriangle,
  Database,
  Eye,
  Filter,
  RotateCcw,
  FileSpreadsheet,
  Clock,
  CheckCircle2,
} from "lucide-react";

const reportes = [
  {
    tipo: "alumnos",
    titulo: "Reporte de Alumnos",
    descripcion:
      "Alumnos registrados, estado documental, asignación, carrera y avance.",
    icono: Users,
    registros: 844,
  },
  {
    tipo: "empresas",
    titulo: "Reporte de Empresas",
    descripcion:
      "Unidades receptoras activas, vencidas, con cupo y sin disponibilidad.",
    icono: Building2,
    registros: 48,
  },
  {
    tipo: "convenios",
    titulo: "Reporte de Convenios",
    descripcion:
      "Convenios vigentes, próximos a vencer, vencidos y renovaciones.",
    icono: FileText,
    registros: 22,
  },
  {
    tipo: "practicas",
    titulo: "Reporte de Prácticas",
    descripcion:
      "Prácticas en proceso, concluidas, rezagadas y liberadas.",
    icono: Briefcase,
    registros: 844,
  },
  {
    tipo: "incidencias",
    titulo: "Reporte de Incidencias",
    descripcion:
      "Observaciones de alumnos, empresas, docentes y documentos.",
    icono: AlertTriangle,
    registros: 46,
  },
  {
    tipo: "brutos",
    titulo: "Datos Brutos para Auditoría",
    descripcion:
      "Exportación completa de registros sin modificar para revisión institucional.",
    icono: Database,
    registros: 1248,
  },
];

const historico = [
  {
    convocatoria: "Verano 2026",
    alumnos: 844,
    empresas: 48,
    convenios: 22,
    incidencias: 46,
    concluidas: 312,
    estado: "Activa",
  },
  {
    convocatoria: "Primavera 2026",
    alumnos: 720,
    empresas: 42,
    convenios: 19,
    incidencias: 38,
    concluidas: 690,
    estado: "Finalizada",
  },
  {
    convocatoria: "Otoño 2025",
    alumnos: 650,
    empresas: 39,
    convenios: 17,
    incidencias: 29,
    concluidas: 640,
    estado: "Archivada",
  },
];

export function DireccionReportes() {
  const [convocatoria, setConvocatoria] = useState("Verano 2026");
  const [carrera, setCarrera] = useState("Todas");
  const [tipoReporte, setTipoReporte] = useState("Todos");
  const [formato, setFormato] = useState("PDF");

  const reportesFiltrados = useMemo(() => {
    return reportes.filter(
      (r) => tipoReporte === "Todos" || r.tipo === tipoReporte,
    );
  }, [tipoReporte]);

  const limpiarFiltros = () => {
    setConvocatoria("Verano 2026");
    setCarrera("Todas");
    setTipoReporte("Todos");
    setFormato("PDF");
  };

  const generarReporte = (tipo?: string, formatoFinal = formato) => {
    alert(
      `Generando reporte ${
        tipo ?? tipoReporte
      } en formato ${formatoFinal} · ${convocatoria} · ${carrera}`,
    );
  };

  const estadoColor = (estado: string) => {
    if (estado === "Activa") return "bg-green-100 text-green-700";
    if (estado === "Finalizada") return "bg-blue-100 text-blue-700";
    return "bg-gray-100 text-gray-700";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">
            Reportes Ejecutivos
          </h1>

          <p className="text-gray-500 text-sm mt-1">
            Generación, consulta y exportación de información histórica para
            Dirección / Secretaría.
          </p>
        </div>

        <button
          onClick={() => generarReporte("datos brutos", "Excel")}
          className="bg-[#0d2b5e] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:bg-[#1565c0]"
        >
          <Database className="w-4 h-4" />
          Exportar datos brutos
        </button>
      </div>

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e] text-sm">
              Filtros de generación
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

        <div className="grid md:grid-cols-5 gap-4">
          <select
            value={convocatoria}
            onChange={(e) => setConvocatoria(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Verano 2026</option>
            <option>Primavera 2026</option>
            <option>Otoño 2025</option>
          </select>

          <select
            value={carrera}
            onChange={(e) => setCarrera(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Todas</option>
            <option>Sistemas Computacionales</option>
            <option>Ing. en Semiconductores</option>
            <option>IA y Ciencia de Datos</option>
            <option>Arquitectura de Sistemas IA</option>
            <option>Desarrollo y Tec. Software</option>
          </select>

          <select
            value={tipoReporte}
            onChange={(e) => setTipoReporte(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option value="Todos">Todos los reportes</option>
            {reportes.map((r) => (
              <option key={r.tipo} value={r.tipo}>
                {r.titulo}
              </option>
            ))}
          </select>

          <select
            value={formato}
            onChange={(e) => setFormato(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>PDF</option>
            <option>Excel</option>
            <option>CSV</option>
          </select>

          <button
            onClick={() => generarReporte()}
            className="bg-[#1565c0] text-white rounded-xl px-4 py-2 font-semibold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Generar
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { l: "Reportes disponibles", v: reportes.length, I: FileText },
          { l: "Convocatorias", v: historico.length, I: Clock },
          { l: "Registros auditables", v: "1,248", I: Database },
          { l: "Prácticas concluidas", v: 312, I: CheckCircle2 },
        ].map((item) => (
          <div
            key={item.l}
            className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3"
          >
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <item.I className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0d2b5e]">{item.v}</div>
              <div className="text-xs text-gray-500">{item.l}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {reportesFiltrados.map((reporte) => (
          <div
            key={reporte.titulo}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                <reporte.icono className="w-6 h-6 text-[#1565c0]" />
              </div>

              <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                {reporte.registros} registros
              </span>
            </div>

            <h3 className="font-bold text-[#0d2b5e] mb-2">
              {reporte.titulo}
            </h3>

            <p className="text-sm text-gray-500 mb-5">
              {reporte.descripcion}
            </p>

            <div className="grid grid-cols-3 gap-2">
              <button className="border border-blue-200 text-[#1565c0] rounded-xl py-2 text-xs font-semibold flex items-center justify-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                Ver
              </button>

              <button
                onClick={() => generarReporte(reporte.tipo, "PDF")}
                className="bg-[#1565c0] text-white rounded-xl py-2 text-xs font-semibold flex items-center justify-center gap-1"
              >
                <Download className="w-3.5 h-3.5" />
                PDF
              </button>

              <button
                onClick={() => generarReporte(reporte.tipo, "Excel")}
                className="border border-green-200 text-green-700 rounded-xl py-2 text-xs font-semibold flex items-center justify-center gap-1 hover:bg-green-50"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-5">
          Historial de convocatorias
        </h3>

        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="py-3">Convocatoria</th>
              <th>Alumnos</th>
              <th>Empresas</th>
              <th>Convenios</th>
              <th>Incidencias</th>
              <th>Concluidas</th>
              <th>Estado</th>
              <th>Acción</th>
            </tr>
          </thead>

          <tbody>
            {historico.map((row) => (
              <tr key={row.convocatoria} className="border-b last:border-0">
                <td className="py-3 font-medium text-[#0d2b5e]">
                  {row.convocatoria}
                </td>
                <td>{row.alumnos}</td>
                <td>{row.empresas}</td>
                <td>{row.convenios}</td>
                <td>{row.incidencias}</td>
                <td>{row.concluidas}</td>
                <td>
                  <span
                    className={`${estadoColor(row.estado)} px-2 py-1 rounded-full text-xs font-semibold`}
                  >
                    {row.estado}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => generarReporte(row.convocatoria, "PDF")}
                    className="text-xs text-[#1565c0] font-semibold hover:underline"
                  >
                    Ver reporte
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}