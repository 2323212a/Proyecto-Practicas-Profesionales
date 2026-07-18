import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Clock,
  Database,
  Download,
  FileText,
  GraduationCap,
  History,
  Search,
  Shield,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  AdminReporteTablaFila,
  AdminReportesFiltros,
  AdminReportesResponse,
  ReporteAdminItem,
} from "../../../domain/admin/AdminReportes";
import { obtenerCarreras, obtenerTiposPractica } from "../../../infrastructure/catalogos/catalogosApi";
import { obtenerRoles } from "../../../infrastructure/roles/rolesApi";
import { descargarReporteAdminPdf, obtenerReportesAdmin } from "../../../infrastructure/admin/adminReportesApi";
import type { ColoredStatCard } from "../../../shared/types/ui";

type RolOpcion = {
  id_rol?: number;
  nombre: string;
};

type CarreraOpcion = {
  id_carrera: number;
  clave?: string;
  nombre: string;
};

type TipoPracticaOpcion = {
  id_tipo_practica: number;
  nombre: string;
};

const filtrosIniciales: Required<AdminReportesFiltros> = {
  periodo: "todos",
  modulo: "todos",
  rol: "todos",
  estado_usuario: "todos",
  busqueda: "",
  carrera: "todos",
  semestre: "todos",
  grupo: "",
  tipo_practica: "todos",
  periodo_practica: "todos",
  estado_empresa: "todos",
  tipo_tramite: "todos",
  tipo_periodo: "todos",
  estado_convocatoria: "todos",
};

const iconos: Record<string, LucideIcon> = {
  usuarios: Users,
  roles: Shield,
  alumnos: GraduationCap,
  empresas: Building2,
  convocatorias: CalendarDays,
  carreras: Database,
  tipos_practica: BriefcaseBusiness,
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

function etiquetaClave(clave: string) {
  return clave.replaceAll("_", " ");
}

function valorCelda(valor: AdminReporteTablaFila[string]) {
  if (valor === true) return "Si";
  if (valor === false) return "No";
  if (valor === null || valor === undefined || valor === "") return "Sin dato";
  return String(valor);
}

function logErrorReportes(endpoint: string, err: unknown) {
  const error = err as {
    message?: string;
    response?: { status?: number; data?: unknown };
    config?: { url?: string; baseURL?: string; params?: unknown };
  };
  console.error("Error al cargar reportes administrativos", {
    endpoint,
    url: error.config?.url,
    baseURL: error.config?.baseURL,
    params: error.config?.params,
    status: error.response?.status,
    response: error.response?.data,
    message: error.message,
    error: err,
  });
}

function ReporteCard({ reporte }: { reporte: ReporteAdminItem }) {
  const Icon = iconos[reporte.clave] ?? BarChart3;
  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
      <Icon className="w-8 h-8 text-[#1565c0] mb-4" />
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

function TablaReporte({ titulo, filas }: { titulo: string; filas: AdminReporteTablaFila[] }) {
  const columnas = Array.from(new Set(filas.flatMap((fila) => Object.keys(fila))));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <h3 className="font-bold text-[#0d2b5e] mb-4 capitalize">{etiquetaClave(titulo)}</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              {columnas.map((columna) => (
                <th key={columna} className="py-3 pr-4 whitespace-nowrap capitalize">
                  {etiquetaClave(columna)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filas.map((fila, index) => (
              <tr key={`${titulo}-${index}`} className="border-b last:border-0">
                {columnas.map((columna) => (
                  <td key={columna} className="py-3 pr-4 text-gray-700 whitespace-nowrap">
                    {columna.includes("fecha") ? formatoFecha(valorCelda(fila[columna])) : valorCelda(fila[columna])}
                  </td>
                ))}
              </tr>
            ))}
            {filas.length === 0 && (
              <tr>
                <td colSpan={Math.max(columnas.length, 1)} className="py-6 text-center text-gray-400">
                  Sin registros
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminReportes() {
  const [datos, setDatos] = useState<AdminReportesResponse | null>(null);
  const [filtros, setFiltros] = useState<Required<AdminReportesFiltros>>(filtrosIniciales);
  const [roles, setRoles] = useState<RolOpcion[]>([]);
  const [carreras, setCarreras] = useState<CarreraOpcion[]>([]);
  const [tiposPractica, setTiposPractica] = useState<TipoPracticaOpcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  async function cargar(filtrosAplicados = filtros) {
    try {
      setCargando(true);
      setError("");
      setDatos(await obtenerReportesAdmin(filtrosAplicados));
    } catch (err) {
      logErrorReportes("GET /admin/reportes/", err);
      setDatos(null);
      setError("No se pudieron cargar los reportes administrativos.");
    } finally {
      setCargando(false);
    }
  }

  async function exportarPdf() {
    if (error || !datos) {
      setError("No se puede exportar porque el reporte no se cargo correctamente.");
      return;
    }

    try {
      await descargarReporteAdminPdf(filtros);
    } catch (err) {
      logErrorReportes("GET /admin/reportes/exportar", err);
      setError("No se pudo generar el PDF del reporte.");
    }
  }

  useEffect(() => {
    void cargar(filtrosIniciales);
    Promise.all([obtenerRoles(), obtenerCarreras(), obtenerTiposPractica()])
      .then(([rolesData, carrerasData, tiposData]) => {
        setRoles(rolesData);
        setCarreras(carrerasData);
        setTiposPractica(tiposData);
      })
      .catch((err) => {
        console.error(err);
      });
  }, []);

  const tarjetas = useMemo<ColoredStatCard[]>(() => {
    const resumen = datos?.resumen ?? {};
    return [
      ["Usuarios", resumen.usuarios ?? 0, Users, "bg-blue-600"],
      ["Alumnos elegibles", resumen.alumnos_elegibles ?? 0, GraduationCap, "bg-green-600"],
      ["Empresas", resumen.empresas ?? 0, Building2, "bg-cyan-700"],
      ["Solicitudes pendientes", resumen.solicitudes_pendientes ?? 0, AlertTriangle, "bg-orange-500"],
      ["Convocatorias", resumen.convocatorias ?? 0, CalendarDays, "bg-indigo-600"],
      ["Tipos de practica", resumen.tipos_practica ?? 0, BriefcaseBusiness, "bg-slate-700"],
      ["Documentos pendientes", resumen.documentos_pendientes ?? 0, FileText, "bg-amber-600"],
      ["Incidencias abiertas", resumen.incidencias_abiertas ?? 0, History, "bg-red-500"],
    ];
  }, [datos?.resumen]);

  const filtrosActivos = Object.entries(filtros).filter(([clave, valor]) => {
    if (clave === "busqueda" || clave === "grupo") return valor.trim() !== "";
    return valor !== "todos";
  });

  function actualizarFiltro(clave: keyof AdminReportesFiltros, valor: string) {
    setFiltros((actual) => ({ ...actual, [clave]: valor }));
  }

  function limpiarFiltros() {
    setFiltros(filtrosIniciales);
    void cargar(filtrosIniciales);
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">Reportes Administrativos</h1>
          <p className="text-gray-500 text-sm mt-1">
            Consulta operativa de usuarios, alumnos, empresas, convocatorias, carreras y tipos de practica.
          </p>
        </div>

        <button
          onClick={exportarPdf}
          disabled={Boolean(error) || !datos}
          className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 w-fit disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-4 h-4" />
          Exportar PDF
        </button>
      </div>

      {error && <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-[#0d2b5e]">Filtros del reporte</h2>
            <p className="text-sm text-gray-500">Los filtros se aplican al consultar y al exportar.</p>
          </div>
          <div className="text-xs text-gray-500">{filtrosActivos.length} filtros activos</div>
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <label className="text-sm text-gray-600">
            Periodo de actividad
            <select value={filtros.periodo} onChange={(e) => actualizarFiltro("periodo", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="todos">Todo el historico</option>
              <option value="30d">Ultimos 30 dias</option>
              <option value="6m">Ultimos 6 meses</option>
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Modulo de auditoria
            <select value={filtros.modulo} onChange={(e) => actualizarFiltro("modulo", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="todos">Todos los modulos</option>
              {(datos?.modulos ?? []).map((item) => (
                <option key={item} value={item}>{item}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Busqueda
            <div className="mt-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                value={filtros.busqueda}
                onChange={(e) => actualizarFiltro("busqueda", e.target.value)}
                placeholder="Correo, nombre, empresa o RFC"
                className="w-full outline-none text-sm"
              />
            </div>
          </label>

          <label className="text-sm text-gray-600">
            Rol
            <select value={filtros.rol} onChange={(e) => actualizarFiltro("rol", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="todos">Todos</option>
              {roles.map((rol) => (
                <option key={rol.id_rol ?? rol.nombre} value={rol.nombre}>{rol.nombre}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Estado de usuario
            <select value={filtros.estado_usuario} onChange={(e) => actualizarFiltro("estado_usuario", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="todos">Todos</option>
              <option value="Activo">Activo</option>
              <option value="Inactivo">Inactivo</option>
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Carrera
            <select value={filtros.carrera} onChange={(e) => actualizarFiltro("carrera", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="todos">Todas</option>
              {carreras.map((carrera) => (
                <option key={carrera.id_carrera} value={String(carrera.id_carrera)}>
                  {carrera.clave ? `${carrera.clave} - ${carrera.nombre}` : carrera.nombre}
                </option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Semestre
            <select value={filtros.semestre} onChange={(e) => actualizarFiltro("semestre", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="todos">Todos</option>
              {Array.from({ length: 12 }, (_, index) => index + 1).map((semestre) => (
                <option key={semestre} value={String(semestre)}>{semestre}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Grupo
            <input value={filtros.grupo} onChange={(e) => actualizarFiltro("grupo", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm" />
          </label>

          <label className="text-sm text-gray-600">
            Tipo de practica
            <select value={filtros.tipo_practica} onChange={(e) => actualizarFiltro("tipo_practica", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="todos">Todos</option>
              {tiposPractica.map((tipo) => (
                <option key={tipo.id_tipo_practica} value={String(tipo.id_tipo_practica)}>{tipo.nombre}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Periodo de practica
            <select value={filtros.periodo_practica} onChange={(e) => actualizarFiltro("periodo_practica", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="todos">Todos</option>
              <option value="Semestral">Semestral</option>
              <option value="Cuatrimestral">Cuatrimestral</option>
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Estado de empresa
            <select value={filtros.estado_empresa} onChange={(e) => actualizarFiltro("estado_empresa", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="todos">Todos</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Aprobada">Aprobada</option>
              <option value="Rechazada">Rechazada</option>
              <option value="Activa">Activa</option>
              <option value="Inactiva">Inactiva</option>
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Tramite empresa
            <select value={filtros.tipo_tramite} onChange={(e) => actualizarFiltro("tipo_tramite", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="todos">Todos</option>
              <option value="Nuevo registro">Nuevo registro</option>
              <option value="Renovacion">Renovacion</option>
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Tipo de periodo
            <select value={filtros.tipo_periodo} onChange={(e) => actualizarFiltro("tipo_periodo", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="todos">Todos</option>
              <option value="Semestral">Semestral</option>
              <option value="Cuatrimestral">Cuatrimestral</option>
              <option value="Ambos">Ambos</option>
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Estado convocatoria
            <select value={filtros.estado_convocatoria} onChange={(e) => actualizarFiltro("estado_convocatoria", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="todos">Todos</option>
              <option value="Activa">Activa</option>
              <option value="Inactiva">Inactiva</option>
              <option value="Finalizada">Finalizada</option>
            </select>
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => cargar()} className="bg-[#0d2b5e] text-white rounded-xl px-4 py-2 text-sm font-semibold">
            Generar reporte
          </button>
          <button onClick={limpiarFiltros} className="bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-2 text-sm font-semibold">
            Limpiar filtros
          </button>
        </div>
      </div>

      {!error && datos && (
        <div className="grid md:grid-cols-4 gap-4">
          {tarjetas.map(([titulo, valor, Icon, color]) => (
            <div key={titulo} className={`${color} rounded-2xl p-5 text-white`}>
              <Icon className="w-7 h-7 mb-3 opacity-80" />
              <div className="text-2xl font-bold">{valor}</div>
              <div className="text-white/80 text-sm">{titulo}</div>
            </div>
          ))}
        </div>
      )}

      {!error && datos && (
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-sm text-gray-500">Estado del sistema</div>
            <div className="mt-2 text-xl font-bold text-[#0d2b5e]">{datos.contexto.estado_sistema ?? "Sin dato"}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-sm text-gray-500">Inscripcion de empresas</div>
            <div className="mt-2 text-xl font-bold text-[#0d2b5e]">{datos.contexto.inscripcion_empresas_estado ?? "Sin dato"}</div>
          </div>
          <div className="bg-white border border-gray-200 rounded-2xl p-5">
            <div className="text-sm text-gray-500">Convocatoria activa</div>
            <div className="mt-2 text-xl font-bold text-[#0d2b5e]">{datos.contexto.convocatoria_activa ?? "Sin convocatoria"}</div>
          </div>
        </div>
      )}

      {cargando ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-400">
          Cargando reportes...
        </div>
      ) : error ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center text-gray-500">
          No se pudieron cargar los reportes administrativos. Revisa la consola para ver el endpoint, status y respuesta del backend.
        </div>
      ) : (
        <>
          <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-5">
            {(datos?.reportes ?? []).map((reporte) => (
              <ReporteCard key={reporte.clave} reporte={reporte} />
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-5">
            {Object.entries(datos?.distribuciones ?? {}).map(([titulo, items]) => (
              <div key={titulo} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <h3 className="font-bold text-[#0d2b5e] mb-4 capitalize">{etiquetaClave(titulo)}</h3>
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

          <div className="grid xl:grid-cols-2 gap-5">
            {Object.entries(datos?.tablas ?? {}).map(([titulo, filas]) => (
              <TablaReporte key={titulo} titulo={titulo} filas={filas} />
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
