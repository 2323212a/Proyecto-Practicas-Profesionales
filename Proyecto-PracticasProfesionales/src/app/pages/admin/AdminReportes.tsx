import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  Clock,
  Database,
  Download,
  FileText,
  History,
  Shield,
  Users,
} from "lucide-react";
import type { AdminReportesResponse, ReporteAdminItem } from "../../../domain/admin/AdminReportes";
import { descargarReportesAdmin, obtenerReportesAdmin } from "../../../infrastructure/admin/adminReportesApi";

const iconos: Record<string, any> = {
  usuarios: Users,
  roles: Shield,
  alumnos: Users,
  empresas: Database,
  horas: Clock,
  documentos: FileText,
  incidencias: AlertTriangle,
  liberaciones: History,
};

function formatoFecha(fecha: string | null) {
  if (!fecha) return "Sin fecha";
  const value = new Date(fecha);
  if (Number.isNaN(value.getTime())) return fecha;
  return value.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function ReporteCard({ reporte }: { reporte: ReporteAdminItem }) {
  const Icon = iconos[reporte.clave] ?? BarChart3;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
      <Icon className="w-9 h-9 text-[#1565c0] mb-4" />
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-[#0d2b5e]">{reporte.titulo}</h3>
          <p className="text-sm text-gray-500 mt-2">{reporte.descripcion}</p>
        </div>
        <span className="bg-blue-50 text-[#1565c0] rounded-full px-3 py-1 text-sm font-bold">
          {reporte.total}
        </span>
      </div>
    </div>
  );
}

export function AdminReportes() {
  const [datos, setDatos] = useState<AdminReportesResponse | null>(null);
  const [periodo, setPeriodo] = useState("todos");
  const [modulo, setModulo] = useState("todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      setDatos(await obtenerReportesAdmin(periodo, modulo));
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los reportes administrativos.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, []);

  const resumen = datos?.resumen ?? {};
  const tarjetas = useMemo(
    () => [
      ["Usuarios", resumen.usuarios ?? 0, Users, "bg-blue-600"],
      ["Documentos pendientes", resumen.documentos_pendientes ?? 0, FileText, "bg-orange-500"],
      ["Incidencias abiertas", resumen.incidencias_abiertas ?? 0, AlertTriangle, "bg-red-500"],
      ["Liberaciones emitidas", resumen.liberaciones_emitidas ?? 0, History, "bg-green-600"],
    ],
    [resumen],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">Reportes Administrativos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Consulta y exportacion de informacion real registrada en el sistema.
          </p>
        </div>

        <button
          onClick={() => descargarReportesAdmin(periodo, modulo)}
          className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 w-fit"
        >
          <Download className="w-4 h-4" />
          Exportar CSV
        </button>
      </div>

      {error && <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">{error}</div>}

      <div className="grid md:grid-cols-3 gap-4">
        <select value={periodo} onChange={(e) => setPeriodo(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option value="todos">Todo el historico</option>
          <option value="30d">Ultimos 30 dias</option>
          <option value="6m">Ultimos 6 meses</option>
        </select>

        <select value={modulo} onChange={(e) => setModulo(e.target.value)} className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option value="todos">Todos los modulos</option>
          {(datos?.modulos ?? []).map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <button onClick={cargar} className="bg-[#0d2b5e] text-white rounded-xl px-4 py-2 text-sm font-semibold">
          Generar reporte
        </button>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {tarjetas.map(([titulo, valor, Icon, color]: any) => (
          <div key={titulo} className={`${color} rounded-2xl p-5 text-white`}>
            <Icon className="w-7 h-7 mb-3 opacity-80" />
            <div className="text-2xl font-bold">{valor}</div>
            <div className="text-white/80 text-sm">{titulo}</div>
          </div>
        ))}
      </div>

      {cargando ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">
          Cargando reportes...
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            {(datos?.reportes ?? []).map((reporte) => (
              <ReporteCard key={reporte.clave} reporte={reporte} />
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {Object.entries(datos?.distribuciones ?? {}).slice(0, 4).map(([titulo, items]) => (
              <div key={titulo} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                <h3 className="font-bold text-[#0d2b5e] mb-4">{titulo.replaceAll("_", " ")}</h3>
                <div className="space-y-3">
                  {items.length === 0 && <div className="text-sm text-gray-400">Sin registros</div>}
                  {items.map((item) => (
                    <div key={`${titulo}-${item.nombre}`} className="flex items-center justify-between gap-3">
                      <span className="text-sm text-gray-600">{item.nombre}</span>
                      <span className="text-sm font-bold text-[#0d2b5e]">{item.total}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-5">Historial de actividad administrativa</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b">
                    <th className="py-3">Fecha</th>
                    <th>Usuario</th>
                    <th>Actividad</th>
                    <th>Modulo</th>
                    <th>Detalle</th>
                    <th>Estado</th>
                  </tr>
                </thead>

                <tbody>
                  {(datos?.actividad ?? []).map((row) => (
                    <tr key={row.id_bitacora} className="border-b last:border-0">
                      <td className="py-3 text-gray-700 whitespace-nowrap">{formatoFecha(row.fecha)}</td>
                      <td className="text-gray-700">{row.usuario}</td>
                      <td className="text-gray-700">{row.accion}</td>
                      <td className="text-gray-600">{row.modulo}</td>
                      <td className="text-gray-600">{row.detalle ?? "Sin detalle"}</td>
                      <td>
                        <span className="px-3 py-1 rounded-full text-xs bg-green-100 text-green-700">
                          {row.estado}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {(datos?.actividad ?? []).length === 0 && (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-gray-400">
                        No hay actividad de auditoria con los filtros seleccionados.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
