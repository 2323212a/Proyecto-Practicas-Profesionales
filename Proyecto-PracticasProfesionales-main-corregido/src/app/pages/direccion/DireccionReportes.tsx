import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Database,
  Download,
  Eye,
  FileText,
  Filter,
  FilterX,
  RefreshCw,
  Search,
  Users,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import type {
  DireccionFiltros,
  DireccionIndicadoresResponse,
} from "../../../domain/direccion/DireccionIndicadores";
import {
  descargarDireccionPdf,
  obtenerIndicadoresDireccion,
} from "../../../infrastructure/direccion/direccionApi";

const iconos: Record<string, LucideIcon> = {
  general: Database,
  alumnos: Users,
  empresas: Building2,
  convenios: FileText,
  vacantes: Briefcase,
  convocatorias: Clock,
  carreras: Users,
};

type ReporteDireccion = DireccionIndicadoresResponse["reportes"][number];
type ConvocatoriaDireccion = DireccionIndicadoresResponse["convocatorias"][number];

function estadoColor(estado: string) {
  const normalizado = estado?.toLowerCase?.() ?? "";

  if (normalizado.includes("activa")) return "bg-green-100 text-green-700 border-green-200";
  if (normalizado.includes("finalizada")) return "bg-blue-100 text-blue-700 border-blue-200";
  if (normalizado.includes("pendiente")) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  if (normalizado.includes("cerrada")) return "bg-gray-100 text-gray-700 border-gray-200";

  return "bg-slate-100 text-slate-700 border-slate-200";
}

function numero(valor: number | undefined | null) {
  return Number(valor ?? 0).toLocaleString("es-MX");
}

const filtrosIniciales: DireccionFiltros = {
  convocatoria: "todos",
  carrera: "todos",
  tipo_practica: "todos",
  periodo_practica: "todos",
  estado_empresa: "todos",
  estado_vacante: "todos",
  estado_convenio: "todos",
  tipo_periodo: "todos",
};

export function DireccionReportes() {
  const [datos, setDatos] = useState<DireccionIndicadoresResponse | null>(null);
  const [tipoReporte, setTipoReporte] = useState("Todos");
  const [busqueda, setBusqueda] = useState("");
  const [filtros, setFiltros] = useState<DireccionFiltros>(filtrosIniciales);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteDireccion | null>(null);
  const [convocatoriaSeleccionada, setConvocatoriaSeleccionada] =
    useState<ConvocatoriaDireccion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState("");

  const cargar = useCallback(async (filtrosConsulta: DireccionFiltros = filtros) => {
    try {
      setCargando(true);
      setError("");
      setDatos(await obtenerIndicadoresDireccion(filtrosConsulta));
    } catch (err) {
      console.error({
        endpoint: "/direccion/indicadores",
        filtros: filtrosConsulta,
        error: err,
      });
      setError("No se pudieron cargar los reportes de Dirección.");
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  async function exportarPdf(filtrosExportacion = filtros) {
    try {
      setExportando(true);
      setError("");
      await descargarDireccionPdf(filtrosExportacion);
    } catch (err) {
      console.error({
        endpoint: "/direccion/reportes/exportar",
        filtros: filtrosExportacion,
        error: err,
      });
      setError("No se pudo generar el PDF de Dirección.");
    } finally {
      setExportando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, [cargar]);

  function actualizarFiltro<K extends keyof DireccionFiltros>(
    campo: K,
    valor: DireccionFiltros[K],
  ) {
    setFiltros((actual) => ({ ...actual, [campo]: valor }));
  }

  function aplicarFiltros() {
    void cargar(filtros);
  }

  function limpiarFiltros() {
    setFiltros(filtrosIniciales);
    setTipoReporte("Todos");
    setBusqueda("");
    void cargar(filtrosIniciales);
  }

  const catalogos = datos?.catalogos;
  const resumen = datos?.resumen;

  const filtrosActivos = useMemo(
    () =>
      Object.values(filtros).filter((valor) => valor && valor !== "todos").length +
      (tipoReporte !== "Todos" ? 1 : 0) +
      (busqueda.trim() ? 1 : 0),
    [filtros, tipoReporte, busqueda],
  );

  const reportesFiltrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return (datos?.reportes ?? []).filter((reporte) => {
      const coincideTipo = tipoReporte === "Todos" || reporte.tipo === tipoReporte;
      const coincideBusqueda =
        !texto ||
        reporte.titulo.toLowerCase().includes(texto) ||
        reporte.descripcion.toLowerCase().includes(texto) ||
        reporte.tipo.toLowerCase().includes(texto);

      return coincideTipo && coincideBusqueda;
    });
  }, [datos, tipoReporte, busqueda]);

  const puedeExportar = Boolean(datos) && !cargando && !error && !exportando;

  return (
    <div className="space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#0d2b5e] via-[#123d7a] to-[#1565c0] p-6 text-white shadow-lg">
        <div className="absolute -right-14 -top-14 h-44 w-44 rounded-full bg-white/10" />
        <div className="absolute -bottom-20 left-20 h-56 w-56 rounded-full bg-[#d4af37]/20" />

        <div className="relative flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold">
              <FileText className="h-3.5 w-3.5" />
              Reportes institucionales
            </div>

            <h1 className="text-2xl font-black tracking-tight lg:text-3xl">
              Reportes Ejecutivos de Dirección
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-blue-100">
              Consulta y exportación de información histórica para Dirección y Secretaría.
              Los reportes son de solo lectura y están orientados a seguimiento institucional.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-blue-100">
              <span className="rounded-full bg-white/10 px-3 py-1">
                Filtros activos: {filtrosActivos}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">
                Reportes disponibles: {datos?.reportes?.length ?? 0}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1">
                Solo lectura
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void cargar()}
              disabled={cargando}
              className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-xs font-bold text-white transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
              Actualizar
            </button>

            <button
              onClick={() => void exportarPdf()}
              disabled={!puedeExportar}
              className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-4 py-2 text-xs font-black text-[#0d2b5e] shadow-sm transition hover:bg-[#e2bf4a] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {exportando ? "Generando..." : "Exportar PDF"}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          {error}
        </div>
      )}

      <section className="rounded-3xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <div className="rounded-xl bg-blue-50 p-2 text-[#1565c0]">
            <Filter className="h-4 w-4" />
          </div>
          <div>
            <h2 className="font-bold text-[#0d2b5e]">Filtros del reporte</h2>
            <p className="text-xs text-gray-500">
              Los filtros aplican tanto a la consulta como al PDF exportado.
            </p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          <CampoSelect
            label="Convocatoria"
            value={filtros.convocatoria ?? "todos"}
            onChange={(value) => actualizarFiltro("convocatoria", value)}
            options={catalogos?.convocatorias ?? []}
            defaultLabel="Todas las convocatorias"
            disabled={cargando}
          />

          <CampoSelect
            label="Carrera"
            value={filtros.carrera ?? "todos"}
            onChange={(value) => actualizarFiltro("carrera", value)}
            options={catalogos?.carreras ?? []}
            defaultLabel="Todas las carreras"
            disabled={cargando}
          />

          <CampoSelect
            label="Tipo de práctica"
            value={filtros.tipo_practica ?? "todos"}
            onChange={(value) => actualizarFiltro("tipo_practica", value)}
            options={catalogos?.tipos_practica ?? []}
            defaultLabel="Todos los tipos"
            disabled={cargando}
          />

          <CampoSelect
            label="Periodo de práctica"
            value={filtros.periodo_practica ?? "todos"}
            onChange={(value) => actualizarFiltro("periodo_practica", value)}
            options={catalogos?.periodos_practica ?? []}
            defaultLabel="Todos los periodos"
            disabled={cargando}
          />

          <CampoSelect
            label="Estado de empresa"
            value={filtros.estado_empresa ?? "todos"}
            onChange={(value) => actualizarFiltro("estado_empresa", value)}
            options={catalogos?.estados_empresa ?? []}
            defaultLabel="Todos los estados"
            disabled={cargando}
          />

          <CampoSelect
            label="Estado de vacante"
            value={filtros.estado_vacante ?? "todos"}
            onChange={(value) => actualizarFiltro("estado_vacante", value)}
            options={catalogos?.estados_vacante ?? []}
            defaultLabel="Todos los estados"
            disabled={cargando}
          />

          <CampoSelect
            label="Estado de convenio"
            value={filtros.estado_convenio ?? "todos"}
            onChange={(value) => actualizarFiltro("estado_convenio", value)}
            options={catalogos?.estados_convenio ?? []}
            defaultLabel="Todos los estados"
            disabled={cargando}
          />

          <CampoSelect
            label="Tipo de periodo"
            value={filtros.tipo_periodo ?? "todos"}
            onChange={(value) => actualizarFiltro("tipo_periodo", value)}
            options={catalogos?.tipos_periodo ?? []}
            defaultLabel="Semestral y cuatrimestral"
            disabled={cargando}
          />
        </div>

        <div className="mt-4 grid gap-3 xl:grid-cols-[1fr_1fr_auto_auto]">
          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">
              Tipo de reporte
            </label>
            <select
              value={tipoReporte}
              onChange={(e) => setTipoReporte(e.target.value)}
              disabled={cargando}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-[#1565c0] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <option value="Todos">Todos los reportes</option>
              {(datos?.reportes ?? []).map((reporte) => (
                <option key={reporte.tipo} value={reporte.tipo}>
                  {reporte.titulo}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">
              Buscar reporte
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                disabled={cargando}
                placeholder="Buscar por título, descripción o tipo..."
                className="w-full rounded-xl border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm text-gray-700 outline-none transition focus:border-[#1565c0] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
              />
            </div>
          </div>

          <button
            onClick={aplicarFiltros}
            disabled={cargando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1565c0] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0d2b5e] disabled:cursor-not-allowed disabled:opacity-60 xl:self-end"
          >
            <Filter className="h-4 w-4" />
            Aplicar
          </button>

          <button
            onClick={limpiarFiltros}
            disabled={cargando || filtrosActivos === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 xl:self-end"
          >
            <FilterX className="h-4 w-4" />
            Limpiar
          </button>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          titulo="Reportes disponibles"
          valor={datos?.reportes?.length ?? 0}
          detalle="Secciones institucionales"
          icono={FileText}
          cargando={cargando}
        />
        <KpiCard
          titulo="Convocatorias"
          valor={datos?.convocatorias?.length ?? 0}
          detalle="Historial disponible"
          icono={Clock}
          cargando={cargando}
        />
        <KpiCard
          titulo="Registros institucionales"
          valor={(resumen?.alumnos ?? 0) + (resumen?.empresas ?? 0)}
          detalle="Alumnos + empresas"
          icono={Database}
          cargando={cargando}
        />
        <KpiCard
          titulo="Alumnos asignados"
          valor={resumen?.alumnos_asignados ?? 0}
          detalle="Con empresa registrada"
          icono={CheckCircle2}
          cargando={cargando}
        />
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {cargando ? (
          <>
            <ReporteSkeleton />
            <ReporteSkeleton />
            <ReporteSkeleton />
          </>
        ) : reportesFiltrados.length > 0 ? (
          reportesFiltrados.map((reporte) => {
            const Icon = iconos[reporte.tipo] ?? FileText;

            return (
              <div
                key={reporte.titulo}
                className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="mb-5 flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-blue-50 p-3 text-[#1565c0]">
                    <Icon className="h-6 w-6" />
                  </div>

                  <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-600">
                    {numero(reporte.registros)} registros
                  </span>
                </div>

                <h3 className="font-bold text-[#0d2b5e]">{reporte.titulo}</h3>
                <p className="mt-2 min-h-12 text-sm leading-5 text-gray-500">
                  {reporte.descripcion}
                </p>

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReporteSeleccionado(reporte)}
                    className="inline-flex items-center justify-center gap-1 rounded-xl border border-blue-200 bg-blue-50 py-2 text-xs font-bold text-[#1565c0] transition hover:bg-blue-100"
                    title="Ver detalle del reporte"
                  >
                    <Eye className="h-3.5 w-3.5" />
                    Ver
                  </button>

                  <button
                    type="button"
                    onClick={() => void exportarPdf(filtros)}
                    disabled={!puedeExportar}
                    className="inline-flex items-center justify-center gap-1 rounded-xl bg-[#1565c0] py-2 text-xs font-bold text-white transition hover:bg-[#0d2b5e] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <Download className="h-3.5 w-3.5" />
                    PDF
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-3xl border border-dashed border-gray-200 bg-white p-10 text-center">
            <p className="font-semibold text-gray-500">No hay reportes para los filtros seleccionados.</p>
            <p className="mt-1 text-sm text-gray-400">
              Limpia los filtros o selecciona otro tipo de reporte.
            </p>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-5">
          <h3 className="font-bold text-[#0d2b5e]">Historial de convocatorias</h3>
          <p className="mt-1 text-xs text-gray-500">
            Resumen histórico para consulta institucional y exportación en PDF.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-left text-xs uppercase tracking-wide text-gray-400">
                <th className="px-4 py-3">Convocatoria</th>
                <th className="px-4 py-3">Periodo</th>
                <th className="px-4 py-3 text-right">Alumnos</th>
                <th className="px-4 py-3 text-right">Empresas</th>
                <th className="px-4 py-3 text-right">Convenios</th>
                <th className="px-4 py-3 text-right">Incidencias</th>
                <th className="px-4 py-3 text-right">Concluidas</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>

            <tbody>
              {cargando ? (
                <tr>
                  <td colSpan={9} className="px-4 py-8">
                    <div className="space-y-3">
                      <div className="h-4 w-full animate-pulse rounded bg-gray-100" />
                      <div className="h-4 w-4/5 animate-pulse rounded bg-gray-100" />
                      <div className="h-4 w-3/5 animate-pulse rounded bg-gray-100" />
                    </div>
                  </td>
                </tr>
              ) : (datos?.convocatorias ?? []).length > 0 ? (
                (datos?.convocatorias ?? []).map((row) => (
                  <tr key={`${row.convocatoria}-${row.periodo}`} className="border-b last:border-0">
                    <td className="px-4 py-3 font-semibold text-[#0d2b5e]">
                      {row.convocatoria}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{row.periodo}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{numero(row.alumnos)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{numero(row.empresas)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">{numero(row.convenios)}</td>
                    <td className="px-4 py-3 text-right text-gray-700">
                      {numero(row.incidencias)}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-700">{numero(row.concluidas)}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`${estadoColor(
                          row.estado,
                        )} rounded-full border px-2 py-1 text-xs font-bold`}
                      >
                        {row.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setConvocatoriaSeleccionada(row)}
                          className="text-xs font-bold text-[#1565c0] hover:underline"
                        >
                          Ver
                        </button>
                        <button
                          onClick={() =>
                            void exportarPdf({
                              ...filtros,
                              convocatoria: row.convocatoria,
                            })
                          }
                          disabled={!puedeExportar}
                          className="text-xs font-bold text-[#1565c0] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} className="px-4 py-10 text-center text-gray-400">
                    No hay convocatorias registradas.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {!cargando && (
        <div className="rounded-2xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs leading-5 text-[#1565c0]">
          Los reportes de Dirección son de consulta. No modifican usuarios, empresas, alumnos,
          convenios, vacantes ni configuración del sistema.
        </div>
      )}

      {reporteSeleccionado && datos && (
        <ReporteDetalleModal
          reporte={reporteSeleccionado}
          datos={datos}
          filtros={filtros}
          exportando={exportando}
          onClose={() => setReporteSeleccionado(null)}
          onExportPdf={() => void exportarPdf(filtros)}
        />
      )}

      {convocatoriaSeleccionada && (
        <ConvocatoriaDetalleModal
          convocatoria={convocatoriaSeleccionada}
          filtros={filtros}
          exportando={exportando}
          onClose={() => setConvocatoriaSeleccionada(null)}
          onExportPdf={() =>
            void exportarPdf({
              ...filtros,
              convocatoria: convocatoriaSeleccionada.convocatoria,
            })
          }
        />
      )}
    </div>
  );
}

function ReporteDetalleModal({
  reporte,
  datos,
  filtros,
  exportando,
  onClose,
  onExportPdf,
}: {
  reporte: ReporteDireccion;
  datos: DireccionIndicadoresResponse;
  filtros: DireccionFiltros;
  exportando: boolean;
  onClose: () => void;
  onExportPdf: () => void;
}) {
  const resumen = datos.resumen;
  const filtrosActivos = obtenerFiltrosActivos(filtros);
  const secciones = obtenerSeccionesReporte(reporte.tipo, datos);
  const indicadores = obtenerIndicadoresReporte(reporte.tipo, datos);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="flex max-h-[92vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-[#0d2b5e] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold">
                <Eye className="h-3.5 w-3.5" />
                Solo lectura
              </div>
              <h2 className="text-xl font-black">{reporte.titulo}</h2>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-blue-100">
                {reporte.descripcion}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-blue-100 transition hover:bg-white/10 hover:text-white"
              aria-label="Cerrar detalle"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2 text-xs text-blue-100">
            <span className="rounded-full bg-white/10 px-3 py-1">Tipo: {reporte.tipo}</span>
            <span className="rounded-full bg-white/10 px-3 py-1">
              Registros: {numero(reporte.registros)}
            </span>
          </div>
        </div>

        <div className="overflow-y-auto p-6">
          <section>
            <h3 className="text-sm font-black uppercase tracking-wide text-[#0d2b5e]">
              Filtros aplicados
            </h3>
            {filtrosActivos.length > 0 ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {filtrosActivos.map((item) => (
                  <span
                    key={`${item.label}-${item.value}`}
                    className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-[#1565c0]"
                  >
                    {item.label}: {item.value}
                  </span>
                ))}
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-500">Sin filtros aplicados.</p>
            )}
          </section>

          <section className="mt-6">
            <h3 className="text-sm font-black uppercase tracking-wide text-[#0d2b5e]">
              Resumen del reporte
            </h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {(indicadores.length > 0 ? indicadores : [
                ["Alumnos", resumen.alumnos],
                ["Empresas", resumen.empresas],
                ["Convenios", resumen.convenios],
                ["Vacantes", resumen.vacantes],
              ]).map(([label, value]) => (
                <div key={label} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                  <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
                  <p className="mt-1 text-2xl font-black text-[#0d2b5e]">{numero(Number(value))}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-6 space-y-5">
            {secciones.length > 0 ? (
              secciones.map((seccion) => (
                <DetalleTabla
                  key={seccion.titulo}
                  titulo={seccion.titulo}
                  columnas={seccion.columnas}
                  filas={seccion.filas}
                />
              ))
            ) : (
              <div className="rounded-2xl border border-dashed border-gray-200 p-8 text-center text-sm text-gray-500">
                Sin datos disponibles para esta seccion.
              </div>
            )}
          </section>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-white"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            disabled={exportando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1565c0] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0d2b5e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {exportando ? "Generando..." : "Exportar PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

function ConvocatoriaDetalleModal({
  convocatoria,
  filtros,
  exportando,
  onClose,
  onExportPdf,
}: {
  convocatoria: ConvocatoriaDireccion;
  filtros: DireccionFiltros;
  exportando: boolean;
  onClose: () => void;
  onExportPdf: () => void;
}) {
  const filtrosActivos = obtenerFiltrosActivos({
    ...filtros,
    convocatoria: convocatoria.convocatoria,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4">
      <div className="w-full max-w-3xl overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="bg-[#0d2b5e] px-6 py-5 text-white">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold">
                <Eye className="h-3.5 w-3.5" />
                Convocatoria
              </div>
              <h2 className="text-xl font-black">{convocatoria.convocatoria}</h2>
              <p className="mt-1 text-sm text-blue-100">
                Periodo {convocatoria.periodo} · {convocatoria.tipo_periodo}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-blue-100 transition hover:bg-white/10 hover:text-white"
              aria-label="Cerrar detalle"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="flex flex-wrap gap-2">
            {filtrosActivos.length > 0 ? (
              filtrosActivos.map((item) => (
                <span
                  key={`${item.label}-${item.value}`}
                  className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-[#1565c0]"
                >
                  {item.label}: {item.value}
                </span>
              ))
            ) : (
              <p className="text-sm text-gray-500">Sin filtros aplicados.</p>
            )}
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Alumnos", convocatoria.alumnos],
              ["Empresas", convocatoria.empresas],
              ["Convenios", convocatoria.convenios],
              ["Incidencias", convocatoria.incidencias],
              ["Concluidas", convocatoria.concluidas],
            ].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
                <p className="mt-1 text-2xl font-black text-[#0d2b5e]">{numero(Number(value))}</p>
              </div>
            ))}
            <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
              <p className="text-xs font-bold uppercase tracking-wide text-gray-400">Estado</p>
              <span className={`${estadoColor(convocatoria.estado)} mt-2 inline-flex rounded-full border px-3 py-1 text-xs font-bold`}>
                {convocatoria.estado}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50 px-6 py-4 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-white"
          >
            Cerrar
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            disabled={exportando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1565c0] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0d2b5e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Download className="h-4 w-4" />
            {exportando ? "Generando..." : "Exportar PDF"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CampoSelect({
  label,
  value,
  onChange,
  options,
  defaultLabel,
  disabled,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: string[];
  defaultLabel: string;
  disabled?: boolean;
}) {
  return (
    <div>
      <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-gray-400">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-700 outline-none transition focus:border-[#1565c0] focus:ring-4 focus:ring-blue-100 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="todos">{defaultLabel}</option>
        {options.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

function KpiCard({
  titulo,
  valor,
  detalle,
  icono: Icono,
  cargando,
}: {
  titulo: string;
  valor: string | number;
  detalle: string;
  icono: LucideIcon;
  cargando: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          {cargando ? (
            <div className="h-8 w-20 animate-pulse rounded-lg bg-gray-100" />
          ) : (
            <p className="text-2xl font-black text-[#0d2b5e]">{numero(Number(valor))}</p>
          )}
          <p className="mt-1 text-sm font-semibold text-gray-700">{titulo}</p>
          <p className="mt-1 text-xs text-gray-400">{detalle}</p>
        </div>

        <div className="rounded-2xl border border-blue-100 bg-blue-50 p-3 text-[#1565c0]">
          <Icono className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function ReporteSkeleton() {
  return (
    <div className="rounded-3xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center justify-between">
        <div className="h-12 w-12 animate-pulse rounded-2xl bg-gray-100" />
        <div className="h-6 w-24 animate-pulse rounded-full bg-gray-100" />
      </div>
      <div className="h-5 w-3/4 animate-pulse rounded bg-gray-100" />
      <div className="mt-3 h-4 w-full animate-pulse rounded bg-gray-100" />
      <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-gray-100" />
      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="h-9 animate-pulse rounded-xl bg-gray-100" />
        <div className="h-9 animate-pulse rounded-xl bg-gray-100" />
      </div>
    </div>
  );
}

function obtenerFiltrosActivos(filtros: DireccionFiltros) {
  const etiquetas: Partial<Record<keyof DireccionFiltros, string>> = {
    convocatoria: "Convocatoria",
    carrera: "Carrera",
    tipo_practica: "Tipo de practica",
    periodo_practica: "Periodo de practica",
    semestre: "Semestre",
    grupo: "Grupo",
    estado_empresa: "Estado de empresa",
    estado_vacante: "Estado de vacante",
    estado_convenio: "Estado de convenio",
    tipo_tramite: "Tipo de tramite",
    tipo_periodo: "Tipo de periodo",
  };

  return Object.entries(filtros)
    .filter(([, value]) => value !== undefined && value !== "" && value !== "todos")
    .map(([key, value]) => ({
      label: etiquetas[key as keyof DireccionFiltros] ?? key,
      value: String(value),
    }));
}

function obtenerIndicadoresReporte(tipo: string, datos: DireccionIndicadoresResponse): Array<[string, number]> {
  const resumen = datos.resumen;

  if (tipo === "alumnos" || tipo === "carreras") {
    return [
      ["Alumnos", resumen.alumnos],
      ["Asignados", resumen.alumnos_asignados],
      ["Sin asignacion", resumen.alumnos_sin_asignacion],
      ["En proceso", resumen.alumnos_en_proceso],
    ];
  }

  if (tipo === "empresas") {
    return [
      ["Empresas", resumen.empresas],
      ["Activas", resumen.empresas_activas],
      ["Pendientes", resumen.empresas_pendientes],
      ["Vacantes", resumen.vacantes],
    ];
  }

  if (tipo === "convenios") {
    return [
      ["Convenios", resumen.convenios],
      ["Vigentes", resumen.convenios_vigentes],
      ["Por vencer", resumen.convenios_por_vencer],
      ["Vencidos", resumen.convenios_vencidos],
    ];
  }

  if (tipo === "vacantes") {
    return [
      ["Vacantes", resumen.vacantes],
      ["Publicadas", resumen.vacantes_publicadas],
      ["Pre-padron", resumen.vacantes_prepadron],
      ["Empresas activas", resumen.empresas_activas],
    ];
  }

  if (tipo === "convocatorias") {
    return [
      ["Convocatorias", resumen.convocatorias],
      ["Alumnos", resumen.alumnos],
      ["Empresas", resumen.empresas],
      ["Incidencias abiertas", resumen.incidencias_abiertas],
    ];
  }

  return [
    ["Alumnos", resumen.alumnos],
    ["Empresas", resumen.empresas],
    ["Convenios", resumen.convenios],
    ["Vacantes", resumen.vacantes],
  ];
}

function obtenerSeccionesReporte(tipo: string, datos: DireccionIndicadoresResponse) {
  const serie = (items: Array<{ nombre: string; total: number }>) =>
    items.map((item) => [item.nombre, numero(item.total)]);

  const alumnosCarrera = datos.alumnos_por_carrera.map((item) => [
    item.carrera,
    numero(item.alumnos),
  ]);

  if (tipo === "alumnos") {
    return [
      { titulo: "Alumnos por carrera", columnas: ["Carrera", "Alumnos"], filas: alumnosCarrera },
      { titulo: "Alumnos por estado", columnas: ["Estado", "Alumnos"], filas: serie(datos.alumnos_por_estado) },
      { titulo: "Alumnos por tipo de practica", columnas: ["Tipo", "Alumnos"], filas: serie(datos.alumnos_por_tipo_practica) },
      { titulo: "Alumnos por semestre", columnas: ["Semestre", "Alumnos"], filas: serie(datos.alumnos_por_semestre) },
    ];
  }

  if (tipo === "empresas") {
    return [
      { titulo: "Empresas por estado", columnas: ["Estado", "Empresas"], filas: serie(datos.empresas_por_estado) },
      { titulo: "Empresas por tipo de tramite", columnas: ["Tipo de tramite", "Empresas"], filas: serie(datos.empresas_por_tipo_tramite) },
      { titulo: "Empresas por periodo de participacion", columnas: ["Periodo", "Empresas"], filas: serie(datos.empresas_por_periodo) },
    ];
  }

  if (tipo === "convenios") {
    return [
      { titulo: "Convenios por estado", columnas: ["Estado", "Convenios"], filas: serie(datos.convenios_por_estado) },
    ];
  }

  if (tipo === "vacantes") {
    return [
      { titulo: "Vacantes por estado", columnas: ["Estado", "Vacantes"], filas: serie(datos.vacantes_por_estado) },
      { titulo: "Vacantes por tipo de practica", columnas: ["Tipo", "Vacantes"], filas: serie(datos.vacantes_por_tipo_practica) },
      { titulo: "Vacantes por periodo", columnas: ["Periodo", "Vacantes"], filas: serie(datos.vacantes_por_periodo) },
    ];
  }

  if (tipo === "convocatorias") {
    return [
      {
        titulo: "Historial de convocatorias",
        columnas: ["Convocatoria", "Periodo", "Tipo", "Alumnos", "Empresas", "Convenios", "Incidencias", "Concluidas", "Estado"],
        filas: datos.convocatorias.map((row) => [
          row.convocatoria,
          row.periodo,
          row.tipo_periodo,
          numero(row.alumnos),
          numero(row.empresas),
          numero(row.convenios),
          numero(row.incidencias),
          numero(row.concluidas),
          row.estado,
        ]),
      },
    ];
  }

  if (tipo === "carreras") {
    return [
      { titulo: "Participacion por carrera", columnas: ["Carrera", "Alumnos"], filas: alumnosCarrera },
    ];
  }

  return [
    { titulo: "Alumnos por carrera", columnas: ["Carrera", "Alumnos"], filas: alumnosCarrera },
    { titulo: "Alumnos por tipo de practica", columnas: ["Tipo", "Alumnos"], filas: serie(datos.alumnos_por_tipo_practica) },
    { titulo: "Empresas por estado", columnas: ["Estado", "Empresas"], filas: serie(datos.empresas_por_estado) },
    { titulo: "Convenios por estado", columnas: ["Estado", "Convenios"], filas: serie(datos.convenios_por_estado) },
    { titulo: "Vacantes por estado", columnas: ["Estado", "Vacantes"], filas: serie(datos.vacantes_por_estado) },
  ];
}

function DetalleTabla({
  titulo,
  columnas,
  filas,
}: {
  titulo: string;
  columnas: string[];
  filas: Array<Array<string | number>>;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <h4 className="font-bold text-[#0d2b5e]">{titulo}</h4>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-white text-left text-xs uppercase tracking-wide text-gray-400">
              {columnas.map((columna) => (
                <th key={columna} className="px-4 py-3">
                  {columna}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.length > 0 ? (
              filas.map((fila, index) => (
                <tr key={`${titulo}-${index}`} className="border-b last:border-0">
                  {fila.map((celda, celdaIndex) => (
                    <td key={`${titulo}-${index}-${celdaIndex}`} className="px-4 py-3 text-gray-700">
                      {celda}
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={columnas.length} className="px-4 py-8 text-center text-gray-400">
                  Sin datos disponibles para esta seccion.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
