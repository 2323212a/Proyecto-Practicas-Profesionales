import { useCallback, useEffect, useState } from "react";
import type { ReactNode } from "react";
import {
  AlertTriangle,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Filter,
  FilterX,
  GraduationCap,
  RefreshCw,
  Search,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type {
  AdminReporteTablaFila,
  AdminReportesFiltros,
  AdminReportesResponse,
} from "../../../domain/admin/AdminReportes";
import { obtenerCarreras, obtenerTiposPractica } from "../../../infrastructure/catalogos/catalogosApi";
import { obtenerRoles } from "../../../infrastructure/roles/rolesApi";
import { obtenerReportesAdmin } from "../../../infrastructure/admin/adminReportesApi";

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

function totalDistribucion(items: { total: number }[] = []) {
  return items.reduce((total, item) => total + Number(item.total ?? 0), 0);
}

function DistribucionCompacta({ items }: { items: { nombre: string; total: number }[] }) {
  const maximo = Math.max(...items.map((item) => item.total), 1);
  return (
    <div className="space-y-3">
      {items.length === 0 && <div className="text-sm text-gray-400">Sin datos disponibles.</div>}
      {items.slice(0, 5).map((item) => (
        <div key={item.nombre} className="space-y-1">
          <div className="flex items-center justify-between gap-3 text-sm">
            <span className="truncate text-gray-600">{item.nombre}</span>
            <span className="font-bold text-[#0d2b5e]">{item.total}</span>
          </div>
          <div className="h-2 rounded-full bg-gray-100">
            <div
              className="h-2 rounded-full bg-[#0d2b5e]"
              style={{ width: `${Math.max(8, (item.total / maximo) * 100)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function ListaDestacada({
  filas,
  tituloCampo,
  subtituloCampos,
  badgeCampo,
}: {
  filas: AdminReporteTablaFila[];
  tituloCampo: string;
  subtituloCampos: string[];
  badgeCampo?: string;
}) {
  return (
    <div className="space-y-3">
      {filas.length === 0 && <div className="text-sm text-gray-400">Sin registros para mostrar.</div>}
      {filas.slice(0, 5).map((fila, index) => (
        <div key={`${tituloCampo}-${index}`} className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-[#0d2b5e]">{valorCelda(fila[tituloCampo])}</div>
              <div className="mt-0.5 truncate text-xs text-gray-500">
                {subtituloCampos.map((campo) => valorCelda(fila[campo])).filter((valor) => valor !== "Sin dato").join(" Â· ") || "Sin detalle"}
              </div>
            </div>
            {badgeCampo && (
              <span className="shrink-0 rounded-full bg-white px-2 py-1 text-[11px] font-semibold text-gray-600 ring-1 ring-gray-200">
                {valorCelda(fila[badgeCampo])}
              </span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function InsightCard({
  titulo,
  valor,
  descripcion,
  icono: Icon,
  children,
}: {
  titulo: string;
  valor: number | string;
  descripcion: string;
  icono: LucideIcon;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <div className="text-sm font-semibold text-gray-500">{titulo}</div>
          <div className="mt-1 text-3xl font-bold text-[#0d2b5e]">{valor}</div>
          <div className="mt-1 text-xs text-gray-500">{descripcion}</div>
        </div>
        <div className="rounded-xl bg-blue-50 p-2 text-[#0d2b5e]">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      {children}
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
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [tab, setTab] = useState<"resumen" | "distribuciones" | "tablas" | "actividad">("resumen");

  const cargar = useCallback(async (filtrosAplicados: AdminReportesFiltros = filtros) => {
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
  }, [filtros]);

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
  }, [cargar]);

  const empresasAceptadas = (datos?.tablas?.empresas_aceptadas ?? []) as AdminReporteTablaFila[];
  const vacantesPublicadas = (datos?.tablas?.vacantes_publicadas ?? []) as AdminReporteTablaFila[];
  const distribuciones = datos?.distribuciones ?? {};
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

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => cargar()}
            disabled={cargando}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${cargando ? "animate-spin" : ""}`} />
            Actualizar
          </button>
        </div>
      </div>

      {error && <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="font-bold text-[#0d2b5e]">Filtros del reporte</h2>
            <p className="text-sm text-gray-500">{filtrosActivos.length === 0 ? "Sin filtros aplicados." : `${filtrosActivos.length} filtros activos.`}</p>
          </div>
          <button
            onClick={() => setMostrarFiltros((actual) => !actual)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700"
          >
            <Filter className="h-4 w-4" />
            {mostrarFiltros ? "Ocultar filtros" : "Mostrar filtros"}
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          {filtrosActivos.length === 0 ? (
            <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">Sin filtros aplicados</span>
          ) : (
            filtrosActivos.map(([clave, valor]) => (
              <span key={clave} className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#0d2b5e]">
                {etiquetaClave(clave)}: {valor}
              </span>
            ))
          )}
        </div>

        {mostrarFiltros && <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
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
        </div>}

        {mostrarFiltros && <div className="flex flex-wrap gap-3">
          <button onClick={() => cargar()} className="bg-[#0d2b5e] text-white rounded-xl px-4 py-2 text-sm font-semibold">
            Generar reporte
          </button>
          <button onClick={limpiarFiltros} className="inline-flex items-center gap-2 bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-2 text-sm font-semibold">
            <FilterX className="h-4 w-4" />
            Limpiar filtros
          </button>
        </div>}
      </div>

      {!error && datos && (
        <div className="grid gap-4 xl:grid-cols-4">
          <InsightCard
            titulo="Usuarios"
            valor={datos.resumen.usuarios ?? 0}
            descripcion={`${datos.resumen.usuarios_activos ?? 0} activos · ${datos.resumen.usuarios_inactivos ?? 0} inactivos`}
            icono={Users}
          >
            <DistribucionCompacta items={distribuciones.usuarios_por_rol ?? []} />
          </InsightCard>

          <InsightCard
            titulo="Alumnos"
            valor={datos.resumen.alumnos ?? 0}
            descripcion={`${datos.resumen.alumnos_elegibles ?? 0} elegibles · ${datos.resumen.alumnos_no_elegibles ?? 0} no elegibles`}
            icono={GraduationCap}
          >
            <DistribucionCompacta items={distribuciones.alumnos_por_carrera ?? []} />
          </InsightCard>

          <InsightCard
            titulo="Empresas aceptadas"
            valor={empresasAceptadas.length}
            descripcion={`${datos.resumen.empresas ?? 0} empresas registradas en total`}
            icono={Building2}
          >
            <ListaDestacada
              filas={empresasAceptadas}
              tituloCampo="empresa"
              subtituloCampos={["giro", "correo"]}
              badgeCampo="tramite"
            />
          </InsightCard>

          <InsightCard
            titulo="Vacantes publicadas"
            valor={datos.resumen.vacantes_activas ?? 0}
            descripcion={`${datos.resumen.vacantes_prepadron ?? 0} en pre-padrón`}
            icono={BriefcaseBusiness}
          >
            <ListaDestacada
              filas={vacantesPublicadas}
              tituloCampo="vacante"
              subtituloCampos={["empresa", "tipo_practica"]}
              badgeCampo="cupos"
            />
          </InsightCard>
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
          <div className="flex flex-wrap gap-2 border-b border-gray-200">
            {[
              ["resumen", "Resumen"],
              ["distribuciones", "Distribuciones"],
              ["tablas", "Tablas"],
              ["actividad", "Actividad"],
            ].map(([id, label]) => (
              <button
                key={id}
                onClick={() => setTab(id as typeof tab)}
                className={`border-b-2 px-4 py-3 text-sm font-semibold ${tab === id ? "border-[#0d2b5e] text-[#0d2b5e]" : "border-transparent text-gray-500"}`}
              >
                {label}
              </button>
            ))}
          </div>

          {tab === "resumen" && <div className="grid gap-5 lg:grid-cols-2">
            <InsightCard
              titulo="Estados de empresa"
              valor={totalDistribucion(distribuciones.empresas_por_estado ?? [])}
              descripcion="Distribución de unidades receptoras registradas"
              icono={Building2}
            >
              <DistribucionCompacta items={distribuciones.empresas_por_estado ?? []} />
            </InsightCard>

            <InsightCard
              titulo="Tipos de práctica"
              valor={totalDistribucion(distribuciones.alumnos_por_tipo_practica ?? [])}
              descripcion="Alumnos asociados por tipo de práctica"
              icono={BriefcaseBusiness}
            >
              <DistribucionCompacta items={distribuciones.alumnos_por_tipo_practica ?? []} />
            </InsightCard>

            <InsightCard
              titulo="Convocatorias"
              valor={datos.resumen.convocatorias ?? 0}
              descripcion={`${datos.contexto.convocatoria_activa ?? "Sin convocatoria activa"}`}
              icono={CalendarDays}
            >
              <ListaDestacada
                filas={(datos.tablas?.convocatorias ?? []) as AdminReporteTablaFila[]}
                tituloCampo="nombre"
                subtituloCampos={["tipo_periodo", "estado"]}
                badgeCampo="fecha_inicio"
              />
            </InsightCard>

            <InsightCard
              titulo="Pendientes"
              valor={(datos.resumen.solicitudes_pendientes ?? 0) + (datos.resumen.documentos_pendientes ?? 0)}
              descripcion="Solicitudes, documentos e incidencias por atender"
              icono={AlertTriangle}
            >
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-lg font-bold text-[#0d2b5e]">{datos.resumen.solicitudes_pendientes ?? 0}</div>
                  <div className="text-[11px] text-gray-500">Solicitudes</div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-lg font-bold text-[#0d2b5e]">{datos.resumen.documentos_pendientes ?? 0}</div>
                  <div className="text-[11px] text-gray-500">Documentos</div>
                </div>
                <div className="rounded-xl bg-gray-50 p-3">
                  <div className="text-lg font-bold text-[#0d2b5e]">{datos.resumen.incidencias_abiertas ?? 0}</div>
                  <div className="text-[11px] text-gray-500">Incidencias</div>
                </div>
              </div>
            </InsightCard>
          </div>}

          {tab === "distribuciones" && <div className="grid lg:grid-cols-2 gap-5">
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
          </div>}

          {tab === "tablas" && <div className="grid xl:grid-cols-2 gap-5">
            {Object.entries(datos?.tablas ?? {}).map(([titulo, filas]) => (
              <TablaReporte key={titulo} titulo={titulo} filas={filas} />
            ))}
          </div>}

          {tab === "actividad" && <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
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
          </div>}
        </>
      )}
    </div>
  );
}
