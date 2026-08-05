import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Briefcase,
  Building2,
  Clock,
  Download,
  Eye,
  FileText,
  Filter,
  FilterX,
  RefreshCw,
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

type ReporteDireccion = DireccionIndicadoresResponse["reportes"][number];
type ConvocatoriaDireccion = DireccionIndicadoresResponse["convocatorias"][number];
type TabDireccion = "resumen" | "alumnos" | "empresas" | "convocatorias" | "incidencias";

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
  const [filtros, setFiltros] = useState<DireccionFiltros>(filtrosIniciales);
  const [reporteSeleccionado, setReporteSeleccionado] = useState<ReporteDireccion | null>(null);
  const [convocatoriaSeleccionada, setConvocatoriaSeleccionada] =
    useState<ConvocatoriaDireccion | null>(null);
  const [cargando, setCargando] = useState(true);
  const [exportando, setExportando] = useState(false);
  const [error, setError] = useState("");
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [tabActiva, setTabActiva] = useState<TabDireccion>("resumen");

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
    void cargar(filtrosIniciales);
  }

  async function exportarPdf() {
    try {
      setExportando(true);
      setError("");
      await descargarDireccionPdf(filtros);
    } catch (err) {
      console.error({
        endpoint: "/direccion/reportes/exportar",
        filtros,
        error: err,
      });
      setError("No se pudo exportar el PDF de Dirección.");
    } finally {
      setExportando(false);
    }
  }

  const catalogos = datos?.catalogos;
  const resumen = datos?.resumen;

  const filtrosActivosDetalle = useMemo(() => {
    return obtenerFiltrosActivos(filtros);
  }, [filtros]);

  const filtrosActivos = filtrosActivosDetalle.length;

  const puntosAtencion = useMemo(() => obtenerPuntosAtencion(datos), [datos]);
  const recomendaciones = useMemo(() => obtenerRecomendaciones(datos), [datos]);

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-bold text-[#0d2b5e]">
              <FileText className="h-3.5 w-3.5" />
              Reportes institucionales
            </div>

            <h1 className="text-2xl font-bold tracking-tight text-[#0d2b5e] lg:text-3xl">
              Reportes de Dirección
            </h1>

            <p className="mt-2 max-w-3xl text-sm leading-6 text-gray-500">
              Consulta indicadores ejecutivos del proceso de prácticas profesionales.
            </p>

            <div className="mt-4 flex flex-wrap gap-2 text-xs text-gray-600">
              <span className="rounded-full bg-gray-100 px-3 py-1">
                Filtros activos: {filtrosActivos}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1">
                Convocatoria activa: {datos?.contexto?.convocatoria_activa ?? "Sin convocatoria activa"}
              </span>
              <span className="rounded-full bg-gray-100 px-3 py-1">
                Solo lectura
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => void cargar()}
              disabled={cargando}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-xs font-bold text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
              Actualizar
            </button>

            <button
              onClick={() => void exportarPdf()}
              disabled={cargando || exportando}
              className="inline-flex items-center gap-2 rounded-xl bg-[#1565c0] px-4 py-2 text-xs font-bold text-white transition hover:bg-[#0d2b5e] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Download className="h-4 w-4" />
              {exportando ? "Exportando..." : "Exportar PDF"}
            </button>
          </div>
        </div>
      </section>

      {error && (
        <div className="rounded-2xl border border-orange-200 bg-orange-50 px-4 py-3 text-sm text-orange-800">
          {error}
        </div>
      )}

      <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="font-bold text-[#0d2b5e]">Filtros del reporte</h2>
            <p className="text-xs text-gray-500">
              {filtrosActivos === 0 ? "Sin filtros aplicados." : `${filtrosActivos} filtros activos.`}
            </p>
          </div>
          <button
            onClick={() => setMostrarFiltros((actual) => !actual)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
          >
            <Filter className="h-4 w-4" />
            {mostrarFiltros ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        {mostrarFiltros && <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
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
        </div>}

        {mostrarFiltros && <div className="mt-4 flex flex-wrap gap-3">
          <button
            onClick={aplicarFiltros}
            disabled={cargando}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#1565c0] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#0d2b5e] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Filter className="h-4 w-4" />
            Aplicar
          </button>

          <button
            onClick={limpiarFiltros}
            disabled={cargando || filtrosActivos === 0}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 px-4 py-2 text-sm font-bold text-gray-600 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <FilterX className="h-4 w-4" />
            Limpiar
          </button>
        </div>}

        <div className="mt-4 flex flex-wrap gap-2">
          {filtrosActivosDetalle.length > 0 ? (
            filtrosActivosDetalle.map((item) => (
              <span
                key={`${item.label}-${item.value}`}
                className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1565c0]"
              >
                {item.label}: {item.value}
              </span>
            ))
          ) : (
            <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-500">
              Sin filtros aplicados
            </span>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          titulo="Alumnos"
          valor={resumen?.alumnos ?? 0}
          detalle={`${numero(resumen?.alumnos_asignados ?? 0)} asignados`}
          icono={Users}
          cargando={cargando}
        />
        <KpiCard
          titulo="Empresas"
          valor={resumen?.empresas ?? 0}
          detalle={`${numero(resumen?.empresas_activas ?? 0)} activas`}
          icono={Building2}
          cargando={cargando}
        />
        <KpiCard
          titulo="Vacantes"
          valor={resumen?.vacantes ?? 0}
          detalle={`${numero(resumen?.vacantes_publicadas ?? 0)} publicadas`}
          icono={Briefcase}
          cargando={cargando}
        />
        <KpiCard
          titulo="Pendientes"
          valor={
            (resumen?.alumnos_sin_asignacion ?? 0) +
            (resumen?.empresas_pendientes ?? 0) +
            (resumen?.vacantes_prepadron ?? 0) +
            (resumen?.incidencias_abiertas ?? 0)
          }
          detalle="Atención operativa"
          icono={Clock}
          cargando={cargando}
        />
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="flex gap-2 overflow-x-auto border-b border-gray-100 px-4 pt-4">
          {[
            ["resumen", "Resumen"],
            ["alumnos", "Alumnos"],
            ["empresas", "Empresas"],
            ["convocatorias", "Convocatorias"],
            ["incidencias", "Incidencias"],
          ].map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setTabActiva(id as TabDireccion)}
              className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-semibold transition ${
                tabActiva === id
                  ? "border-[#1565c0] text-[#0d2b5e]"
                  : "border-transparent text-gray-500 hover:text-[#0d2b5e]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {cargando ? (
            <div className="grid gap-4 md:grid-cols-2">
              <ReporteSkeleton />
              <ReporteSkeleton />
            </div>
          ) : tabActiva === "resumen" ? (
            <div className="grid gap-5 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="space-y-5">
                <PanelTitulo
                  titulo="Estado general del proceso"
                  descripcion="Lectura rápida de participación, publicación de vacantes y seguimiento."
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <MiniIndicador label="Alumnos en proceso" value={resumen?.alumnos_en_proceso ?? 0} />
                  <MiniIndicador label="Alumnos sin asignación" value={resumen?.alumnos_sin_asignacion ?? 0} />
                  <MiniIndicador label="Empresas activas" value={resumen?.empresas_activas ?? 0} />
                  <MiniIndicador label="Convenios vigentes" value={resumen?.convenios_vigentes ?? 0} />
                  <MiniIndicador label="Vacantes en PrePadrón" value={resumen?.vacantes_prepadron ?? 0} />
                  <MiniIndicador label="Horas registradas" value={resumen?.horas_registradas ?? 0} />
                </div>
                <BarList titulo="Vacantes por estado" datos={datos?.vacantes_por_estado ?? []} />
              </div>

              <div className="space-y-5">
                <ListaEjecutiva
                  titulo="Puntos de atención"
                  items={puntosAtencion}
                  vacio="No hay puntos críticos con los filtros actuales."
                />
                <ListaEjecutiva
                  titulo="Recomendaciones"
                  items={recomendaciones}
                  vacio="Mantener seguimiento ordinario del proceso."
                />
              </div>
            </div>
          ) : tabActiva === "alumnos" ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <BarList titulo="Alumnos por carrera" datos={(datos?.alumnos_por_carrera ?? []).map((item) => ({ nombre: item.carrera, total: item.alumnos }))} />
              <BarList titulo="Alumnos por tipo de práctica" datos={datos?.alumnos_por_tipo_practica ?? []} />
              <DetalleTabla
                titulo="Alumnos por estado"
                columnas={["Estado", "Alumnos"]}
                filas={(datos?.alumnos_por_estado ?? []).map((item) => [item.nombre, numero(item.total)])}
              />
            </div>
          ) : tabActiva === "empresas" ? (
            <div className="grid gap-5 xl:grid-cols-2">
              <BarList titulo="Empresas por estado" datos={datos?.empresas_por_estado ?? []} />
              <BarList titulo="Empresas por tipo de trámite" datos={datos?.empresas_por_tipo_tramite ?? []} />
              <DetalleTabla
                titulo="Convenios por estado"
                columnas={["Estado", "Convenios"]}
                filas={(datos?.convenios_por_estado ?? []).map((item) => [item.nombre, numero(item.total)])}
              />
            </div>
          ) : tabActiva === "convocatorias" ? (
            <div className="space-y-5">
              <HistorialConvocatorias
                convocatorias={datos?.convocatorias ?? []}
                onVer={setConvocatoriaSeleccionada}
              />
              <div className="grid gap-5 xl:grid-cols-2">
                <BarList titulo="Convocatorias por tipo de periodo" datos={datos?.convocatorias_por_tipo_periodo ?? []} />
                <BarList titulo="Vacantes por periodo" datos={datos?.vacantes_por_periodo ?? []} />
              </div>
            </div>
          ) : (
            <div className="grid gap-5 xl:grid-cols-2">
              <ListaEjecutiva
                titulo="Incidencias y pendientes"
                items={puntosAtencion}
                vacio="No hay incidencias abiertas ni pendientes relevantes."
              />
              <BarList
                titulo="Horas registradas por mes"
                datos={(datos?.horas_por_mes ?? []).map((item) => ({ nombre: item.mes, total: item.horas }))}
              />
            </div>
          )}
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
          onClose={() => setReporteSeleccionado(null)}
        />
      )}

      {convocatoriaSeleccionada && (
        <ConvocatoriaDetalleModal
          convocatoria={convocatoriaSeleccionada}
          filtros={filtros}
          onClose={() => setConvocatoriaSeleccionada(null)}
        />
      )}
    </div>
  );
}

function PanelTitulo({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <div>
      <h3 className="font-bold text-[#0d2b5e]">{titulo}</h3>
      <p className="mt-1 text-sm text-gray-500">{descripcion}</p>
    </div>
  );
}

function MiniIndicador({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-gray-50 p-4">
      <p className="text-xs font-bold uppercase tracking-wide text-gray-400">{label}</p>
      <p className="mt-2 text-2xl font-black text-[#0d2b5e]">{numero(value)}</p>
    </div>
  );
}

function ListaEjecutiva({
  titulo,
  items,
  vacio,
}: {
  titulo: string;
  items: string[];
  vacio: string;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="font-bold text-[#0d2b5e]">{titulo}</h3>
      <div className="mt-4 space-y-3">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-700">
              {item}
            </div>
          ))
        ) : (
          <p className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-500">
            {vacio}
          </p>
        )}
      </div>
    </div>
  );
}

function BarList({
  titulo,
  datos,
}: {
  titulo: string;
  datos: Array<{ nombre: string; total: number }>;
}) {
  const maximo = Math.max(...datos.map((item) => Number(item.total) || 0), 0);

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h3 className="font-bold text-[#0d2b5e]">{titulo}</h3>
      <div className="mt-4 space-y-3">
        {datos.length > 0 ? (
          datos.slice(0, 8).map((item) => {
            const total = Number(item.total) || 0;
            const ancho = maximo > 0 ? Math.max((total / maximo) * 100, 4) : 0;

            return (
              <div key={`${titulo}-${item.nombre}`} className="space-y-1">
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="truncate font-semibold text-gray-600">{item.nombre}</span>
                  <span className="font-bold text-[#0d2b5e]">{numero(total)}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                  <div className="h-full rounded-full bg-[#1565c0]" style={{ width: `${ancho}%` }} />
                </div>
              </div>
            );
          })
        ) : (
          <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-400">
            Sin datos disponibles.
          </p>
        )}
      </div>
    </div>
  );
}

function HistorialConvocatorias({
  convocatorias,
  onVer,
}: {
  convocatorias: ConvocatoriaDireccion[];
  onVer: (convocatoria: ConvocatoriaDireccion) => void;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200">
      <div className="border-b border-gray-100 bg-gray-50 px-4 py-3">
        <h3 className="font-bold text-[#0d2b5e]">Historial de convocatorias</h3>
        <p className="mt-1 text-xs text-gray-500">Resumen histórico para consulta institucional.</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-white text-left text-xs uppercase tracking-wide text-gray-400">
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
            {convocatorias.length > 0 ? (
              convocatorias.map((row) => (
                <tr key={`${row.convocatoria}-${row.periodo}`} className="border-b last:border-0">
                  <td className="px-4 py-3 font-semibold text-[#0d2b5e]">{row.convocatoria}</td>
                  <td className="px-4 py-3 text-gray-600">{row.periodo}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{numero(row.alumnos)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{numero(row.empresas)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{numero(row.convenios)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{numero(row.incidencias)}</td>
                  <td className="px-4 py-3 text-right text-gray-700">{numero(row.concluidas)}</td>
                  <td className="px-4 py-3">
                    <span className={`${estadoColor(row.estado)} rounded-full border px-2 py-1 text-xs font-bold`}>
                      {row.estado}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      type="button"
                      onClick={() => onVer(row)}
                      className="text-xs font-bold text-[#1565c0] hover:underline"
                    >
                      Ver
                    </button>
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
    </div>
  );
}

function ReporteDetalleModal({
  reporte,
  datos,
  filtros,
  onClose,
}: {
  reporte: ReporteDireccion;
  datos: DireccionIndicadoresResponse;
  filtros: DireccionFiltros;
  onClose: () => void;
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
                Sin datos disponibles para esta sección.
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
        </div>
      </div>
    </div>
  );
}

function ConvocatoriaDetalleModal({
  convocatoria,
  filtros,
  onClose,
}: {
  convocatoria: ConvocatoriaDireccion;
  filtros: DireccionFiltros;
  onClose: () => void;
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
    tipo_practica: "Tipo de práctica",
    periodo_practica: "Periodo de práctica",
    semestre: "Semestre",
    grupo: "Grupo",
    estado_empresa: "Estado de empresa",
    estado_vacante: "Estado de vacante",
    estado_convenio: "Estado de convenio",
    tipo_tramite: "Tipo de trámite",
    tipo_periodo: "Tipo de periodo",
  };

  return Object.entries(filtros)
    .filter(([, value]) => value !== undefined && value !== "" && value !== "todos")
    .map(([key, value]) => ({
      label: etiquetas[key as keyof DireccionFiltros] ?? key,
      value: String(value),
    }));
}

function obtenerPuntosAtencion(datos: DireccionIndicadoresResponse | null): string[] {
  if (!datos) return [];
  const resumen = datos.resumen;
  const puntos: string[] = [];
  const vacantesNoPublicadas = Math.max(
    (resumen.vacantes ?? 0) - (resumen.vacantes_publicadas ?? 0),
    0,
  );

  if (resumen.alumnos_sin_asignacion > 0) {
    puntos.push(`${numero(resumen.alumnos_sin_asignacion)} alumnos sin asignación.`);
  }
  if (resumen.empresas_pendientes > 0) {
    puntos.push(`${numero(resumen.empresas_pendientes)} empresas pendientes de revisión.`);
  }
  if (resumen.vacantes_prepadron > 0) {
    puntos.push(`${numero(resumen.vacantes_prepadron)} vacantes en PrePadrón listas para liberación.`);
  }
  if (vacantesNoPublicadas > 0) {
    puntos.push(`${numero(vacantesNoPublicadas)} vacantes todavía no publicadas.`);
  }
  if (resumen.convenios_por_vencer > 0) {
    puntos.push(`${numero(resumen.convenios_por_vencer)} convenios por vencer en los próximos 30 días.`);
  }
  if (resumen.convenios_vencidos > 0) {
    puntos.push(`${numero(resumen.convenios_vencidos)} convenios vencidos.`);
  }
  if (resumen.incidencias_abiertas > 0) {
    puntos.push(`${numero(resumen.incidencias_abiertas)} incidencias abiertas o en seguimiento.`);
  }
  if (!datos.contexto.convocatoria_activa) {
    puntos.push("No hay convocatoria activa registrada.");
  }

  return puntos;
}

function obtenerRecomendaciones(datos: DireccionIndicadoresResponse | null): string[] {
  if (!datos) return [];
  const resumen = datos.resumen;
  const recomendaciones: string[] = [];

  if (resumen.alumnos_sin_asignacion > 0) {
    recomendaciones.push("Priorizar asignaciones de alumnos sin empresa para evitar rezago operativo.");
  }
  if (resumen.empresas_pendientes > 0) {
    recomendaciones.push("Dar seguimiento a empresas pendientes para ampliar opciones del padrón.");
  }
  if (resumen.vacantes_prepadron > 0) {
    recomendaciones.push("Revisar liberación de vacantes en PrePadrón para publicarlas oportunamente.");
  }
  if (resumen.convenios_por_vencer > 0 || resumen.convenios_vencidos > 0) {
    recomendaciones.push("Solicitar revisión documental de convenios próximos a vencer o vencidos.");
  }
  if (resumen.incidencias_abiertas > 0) {
    recomendaciones.push("Escalar incidencias abiertas con mayor antigüedad al área responsable.");
  }
  if (!datos.contexto.convocatoria_activa) {
    recomendaciones.push("Confirmar el calendario de convocatoria antes de abrir nuevos procesos.");
  }

  return recomendaciones;
}

function obtenerIndicadoresReporte(tipo: string, datos: DireccionIndicadoresResponse): Array<[string, number]> {
  const resumen = datos.resumen;

  if (tipo === "alumnos" || tipo === "carreras") {
    return [
      ["Alumnos", resumen.alumnos],
      ["Asignados", resumen.alumnos_asignados],
      ["Sin asignación", resumen.alumnos_sin_asignacion],
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
      ["PrePadrón", resumen.vacantes_prepadron],
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
      { titulo: "Alumnos por tipo de práctica", columnas: ["Tipo", "Alumnos"], filas: serie(datos.alumnos_por_tipo_practica) },
      { titulo: "Alumnos por semestre", columnas: ["Semestre", "Alumnos"], filas: serie(datos.alumnos_por_semestre) },
    ];
  }

  if (tipo === "empresas") {
    return [
      { titulo: "Empresas por estado", columnas: ["Estado", "Empresas"], filas: serie(datos.empresas_por_estado) },
      { titulo: "Empresas por tipo de trámite", columnas: ["Tipo de trámite", "Empresas"], filas: serie(datos.empresas_por_tipo_tramite) },
      { titulo: "Empresas por periodo", columnas: ["Periodo", "Empresas"], filas: serie(datos.empresas_por_periodo) },
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
      { titulo: "Vacantes por tipo de práctica", columnas: ["Tipo", "Vacantes"], filas: serie(datos.vacantes_por_tipo_practica) },
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
      { titulo: "Participación por carrera", columnas: ["Carrera", "Alumnos"], filas: alumnosCarrera },
    ];
  }

  return [
    { titulo: "Alumnos por carrera", columnas: ["Carrera", "Alumnos"], filas: alumnosCarrera },
    { titulo: "Alumnos por tipo de práctica", columnas: ["Tipo", "Alumnos"], filas: serie(datos.alumnos_por_tipo_practica) },
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
                  Sin datos disponibles para esta sección.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
