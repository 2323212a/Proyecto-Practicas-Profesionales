import { useCallback, useEffect, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Search, ShieldCheck } from "lucide-react";
import type {
  BitacoraAuditoriaFiltros,
  BitacoraAuditoriaResponse,
} from "../../../domain/admin/BitacoraAuditoria";
import { obtenerBitacoraAuditoria } from "../../../infrastructure/admin/bitacoraAuditoriaApi";

const filtrosIniciales: BitacoraAuditoriaFiltros = {
  fecha_inicio: "",
  fecha_fin: "",
  modulo: "todos",
  accion: "todos",
  entidad: "todos",
  usuario: "",
  pagina: 1,
  limite: 25,
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

function limpiarParams(filtros: BitacoraAuditoriaFiltros) {
  return Object.fromEntries(
    Object.entries(filtros).filter(([, valor]) => {
      if (valor === undefined || valor === null) return false;
      if (typeof valor === "string" && (valor.trim() === "" || valor === "todos")) return false;
      return true;
    })
  );
}

export function AdminBitacora() {
  const [datos, setDatos] = useState<BitacoraAuditoriaResponse | null>(null);
  const [filtros, setFiltros] = useState<BitacoraAuditoriaFiltros>(filtrosIniciales);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  const cargar = useCallback(async (filtrosAplicados: BitacoraAuditoriaFiltros = filtros) => {
    try {
      setCargando(true);
      setError("");
      const params = limpiarParams(filtrosAplicados);
      setDatos(await obtenerBitacoraAuditoria(params));
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la bitacora de auditoria.");
    } finally {
      setCargando(false);
    }
  }, [filtros]);

  useEffect(() => {
    void cargar(filtrosIniciales);
  }, [cargar]);

  function actualizarFiltro(clave: keyof BitacoraAuditoriaFiltros, valor: string | number) {
    setFiltros((actual) => {
      const siguiente: BitacoraAuditoriaFiltros = { ...actual, [clave]: valor };
      siguiente.pagina = clave === "pagina" ? Number(valor) || 1 : 1;
      return siguiente;
    });
  }

  function limpiarFiltros() {
    setFiltros(filtrosIniciales);
    void cargar(filtrosIniciales);
  }

  const pagina = datos?.pagina ?? 1;
  const totalPaginas = datos?.total_paginas ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Bitacora de acciones</h1>
        <p className="text-gray-500 text-sm mt-1">
          Consulta de acciones administrativas registradas sin contrasenas, hashes ni tokens.
        </p>
      </div>

      {error && <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">{error}</div>}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-4">
        <div className="flex items-center gap-2 text-[#0d2b5e] font-bold">
          <ShieldCheck className="w-5 h-5" />
          Filtros
        </div>

        <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-3">
          <label className="text-sm text-gray-600">
            Fecha desde
            <div className="mt-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filtros.fecha_inicio ?? ""}
                onChange={(e) => actualizarFiltro("fecha_inicio", e.target.value)}
                className="w-full outline-none text-sm"
              />
            </div>
          </label>

          <label className="text-sm text-gray-600">
            Fecha hasta
            <div className="mt-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <CalendarDays className="w-4 h-4 text-gray-400" />
              <input
                type="date"
                value={filtros.fecha_fin ?? ""}
                onChange={(e) => actualizarFiltro("fecha_fin", e.target.value)}
                className="w-full outline-none text-sm"
              />
            </div>
          </label>

          <label className="text-sm text-gray-600">
            Modulo
            <select value={filtros.modulo ?? "todos"} onChange={(e) => actualizarFiltro("modulo", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="todos">Todos</option>
              {(datos?.modulos ?? []).map((modulo) => (
                <option key={modulo} value={modulo}>{modulo}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Accion
            <select value={filtros.accion ?? "todos"} onChange={(e) => actualizarFiltro("accion", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="todos">Todas</option>
              {(datos?.acciones ?? []).map((accion) => (
                <option key={accion} value={accion}>{accion}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-600">
            Entidad
            <select value={filtros.entidad ?? "todos"} onChange={(e) => actualizarFiltro("entidad", e.target.value)} className="mt-1 w-full bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="todos">Todas</option>
              {(datos?.entidades ?? []).map((entidad) => (
                <option key={entidad} value={entidad}>{entidad}</option>
              ))}
            </select>
          </label>

          <label className="text-sm text-gray-600 md:col-span-2">
            Usuario
            <div className="mt-1 flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-3 py-2">
              <Search className="w-4 h-4 text-gray-400" />
              <input
                value={filtros.usuario ?? ""}
                onChange={(e) => actualizarFiltro("usuario", e.target.value)}
                placeholder="Correo, ID de usuario o texto de actividad"
                className="w-full outline-none text-sm"
              />
            </div>
          </label>
        </div>

        <div className="flex flex-wrap gap-3">
          <button onClick={() => cargar()} className="bg-[#0d2b5e] text-white rounded-xl px-4 py-2 text-sm font-semibold">
            Consultar
          </button>
          <button onClick={limpiarFiltros} className="bg-white border border-gray-200 text-gray-700 rounded-xl px-4 py-2 text-sm font-semibold">
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="font-bold text-[#0d2b5e]">Registros</h2>
            <p className="text-sm text-gray-500">{datos?.total ?? 0} acciones encontradas</p>
          </div>
          <div className="text-sm text-gray-500">Pagina {pagina} de {totalPaginas}</div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-3 pr-4">Fecha</th>
                <th className="pr-4">Usuario</th>
                <th className="pr-4">Modulo</th>
                <th className="pr-4">Accion</th>
                <th className="pr-4">Descripcion</th>
                <th className="pr-4">Entidad</th>
                <th className="pr-4">ID entidad</th>
              </tr>
            </thead>
            <tbody>
              {cargando && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    Cargando bitacora...
                  </td>
                </tr>
              )}

              {!cargando && (datos?.items ?? []).map((item) => (
                <tr key={item.id_bitacora} className="border-b last:border-0">
                  <td className="py-3 pr-4 text-gray-700 whitespace-nowrap">{formatoFecha(item.fecha)}</td>
                  <td className="pr-4 text-gray-700">
                    <div className="font-semibold">{item.usuario_correo ?? "Sistema"}</div>
                    <div className="text-xs text-gray-500">{item.id_usuario ? `ID ${item.id_usuario}` : "Sin usuario"}</div>
                  </td>
                  <td className="pr-4">
                    <span className="px-3 py-1 rounded-full text-xs bg-blue-50 text-blue-700">
                      {item.modulo}
                    </span>
                  </td>
                  <td className="pr-4">
                    <span className="px-3 py-1 rounded-full text-xs bg-slate-100 text-slate-700">
                      {item.accion}
                    </span>
                  </td>
                  <td className="pr-4 text-gray-700 min-w-80">{item.descripcion ?? "Sin descripcion"}</td>
                  <td className="pr-4 text-gray-600">{item.entidad ?? "Sin entidad"}</td>
                  <td className="pr-4 text-gray-600">{item.id_entidad ?? "Sin dato"}</td>
                </tr>
              ))}

              {!cargando && (datos?.items ?? []).length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    No hay registros con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-end gap-2 mt-4">
          <button
            disabled={pagina <= 1}
            onClick={() => {
              const siguiente = Math.max(1, pagina - 1);
              const nuevosFiltros = { ...filtros, pagina: siguiente };
              setFiltros(nuevosFiltros);
              void cargar(nuevosFiltros);
            }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm disabled:opacity-40 flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Anterior
          </button>
          <button
            disabled={pagina >= totalPaginas}
            onClick={() => {
              const siguiente = Math.min(totalPaginas, pagina + 1);
              const nuevosFiltros = { ...filtros, pagina: siguiente };
              setFiltros(nuevosFiltros);
              void cargar(nuevosFiltros);
            }}
            className="border border-gray-200 rounded-xl px-3 py-2 text-sm disabled:opacity-40 flex items-center gap-1"
          >
            Siguiente
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
