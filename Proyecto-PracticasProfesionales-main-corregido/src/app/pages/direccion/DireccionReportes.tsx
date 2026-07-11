import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type { DireccionIndicadoresResponse } from "../../../domain/direccion/DireccionIndicadores";
import { descargarDireccionCsv, obtenerIndicadoresDireccion } from "../../../infrastructure/direccion/direccionApi";

const iconos: Record<string, LucideIcon> = {
  alumnos: Users,
  empresas: Building2,
  convenios: FileText,
  practicas: Briefcase,
  incidencias: AlertTriangle,
  brutos: Database,
};

function estadoColor(estado: string) {
  if (estado === "Activa") return "bg-green-100 text-green-700";
  if (estado === "Finalizada") return "bg-blue-100 text-blue-700";
  return "bg-gray-100 text-gray-700";
}

export function DireccionReportes() {
  const [datos, setDatos] = useState<DireccionIndicadoresResponse | null>(null);
  const [tipoReporte, setTipoReporte] = useState("Todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void cargar();
  }, []);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      setDatos(await obtenerIndicadoresDireccion());
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los reportes ejecutivos.");
    } finally {
      setCargando(false);
    }
  }

  const reportesFiltrados = useMemo(
    () => (datos?.reportes ?? []).filter((r) => tipoReporte === "Todos" || r.tipo === tipoReporte),
    [datos, tipoReporte],
  );

  const resumen = datos?.resumen;

  return (
    <div className="space-y-6">
      <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">Reportes Ejecutivos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Consulta y exportacion de informacion historica para Direccion / Secretaria.
          </p>
        </div>

        <button
          onClick={() => void descargarDireccionCsv("brutos")}
          className="bg-[#0d2b5e] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 hover:bg-[#1565c0]"
        >
          <Database className="w-4 h-4" />
          Exportar datos brutos
        </button>
      </div>

      {error && <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">{error}</div>}

      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
        <div className="grid md:grid-cols-[1fr_auto] gap-4">
          <select
            value={tipoReporte}
            onChange={(e) => setTipoReporte(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option value="Todos">Todos los reportes</option>
            {(datos?.reportes ?? []).map((r) => (
              <option key={r.tipo} value={r.tipo}>{r.titulo}</option>
            ))}
          </select>

          <button
            onClick={() => void descargarDireccionCsv(tipoReporte === "Todos" ? "brutos" : tipoReporte)}
            className="bg-[#1565c0] text-white rounded-xl px-4 py-2 font-semibold flex items-center justify-center gap-2"
          >
            <Download className="w-4 h-4" />
            Exportar CSV
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {[
          { l: "Reportes disponibles", v: datos?.reportes.length ?? 0, I: FileText },
          { l: "Convocatorias", v: datos?.convocatorias.length ?? 0, I: Clock },
          { l: "Registros auditables", v: (resumen?.alumnos ?? 0) + (resumen?.documentos ?? 0), I: Database },
          { l: "Practicas concluidas", v: resumen?.concluidos ?? 0, I: CheckCircle2 },
        ].map((item) => (
          <div key={item.l} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <item.I className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0d2b5e]">{cargando ? "..." : item.v}</div>
              <div className="text-xs text-gray-500">{item.l}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-5">
        {reportesFiltrados.map((reporte) => {
          const Icon = iconos[reporte.tipo] ?? FileText;
          return (
            <div key={reporte.titulo} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between mb-4">
                <div className="w-11 h-11 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Icon className="w-6 h-6 text-[#1565c0]" />
                </div>
                <span className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">
                  {reporte.registros} registros
                </span>
              </div>

              <h3 className="font-bold text-[#0d2b5e] mb-2">{reporte.titulo}</h3>
              <p className="text-sm text-gray-500 mb-5">{reporte.descripcion}</p>

              <div className="grid grid-cols-2 gap-2">
                <button className="border border-blue-200 text-[#1565c0] rounded-xl py-2 text-xs font-semibold flex items-center justify-center gap-1">
                  <Eye className="w-3.5 h-3.5" />
                  Ver
                </button>
                <button
                  onClick={() => void descargarDireccionCsv(reporte.tipo)}
                  className="bg-[#1565c0] text-white rounded-xl py-2 text-xs font-semibold flex items-center justify-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  CSV
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 overflow-x-auto">
        <h3 className="font-bold text-[#0d2b5e] mb-5">Historial de convocatorias</h3>
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
              <th>Accion</th>
            </tr>
          </thead>
          <tbody>
            {(datos?.convocatorias ?? []).map((row) => (
              <tr key={`${row.convocatoria}-${row.periodo}`} className="border-b last:border-0">
                <td className="py-3 font-medium text-[#0d2b5e]">{row.convocatoria}</td>
                <td>{row.alumnos}</td>
                <td>{row.empresas}</td>
                <td>{row.convenios}</td>
                <td>{row.incidencias}</td>
                <td>{row.concluidas}</td>
                <td>
                  <span className={`${estadoColor(row.estado)} px-2 py-1 rounded-full text-xs font-semibold`}>
                    {row.estado}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => void descargarDireccionCsv(row.convocatoria)}
                    className="text-xs text-[#1565c0] font-semibold hover:underline"
                  >
                    Exportar
                  </button>
                </td>
              </tr>
            ))}
            {!cargando && (datos?.convocatorias ?? []).length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-400">No hay convocatorias registradas.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
