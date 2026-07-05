import {
  Search,
  Building2,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Eye,
  CheckCircle,
} from "lucide-react";

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import {
  listarEmpresas,
  validarEmpresa,
  type EmpresaApi,
} from "../../../infrastructure/coord-unidades/coordUnidadesApi";

const estadoColor: Record<string, string> = {
  Pendiente: "bg-orange-100 text-orange-700",
  Aprobada: "bg-green-100 text-green-700",
  "En revisión": "bg-yellow-100 text-yellow-700",
  "En Revision": "bg-yellow-100 text-yellow-700",
  Rechazada: "bg-red-100 text-red-700",
  Suspendida: "bg-gray-100 text-gray-600",
  Inactiva: "bg-gray-100 text-gray-600",
};

interface Empresa extends EmpresaApi {}

const normalizeEstado = (estado?: string) => {
  if (!estado) return "Sin estado";
  if (estado === "En Revision") return "En revisión";
  return estado;
};

export function ValidacionEmpresas() {
  const [empresas, setEmpresas] = useState<Empresa[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [validandoId, setValidandoId] = useState<number | null>(null);
  const [busqueda, setBusqueda] = useState("");
  const [filtroEstado, setFiltroEstado] = useState("");
  const [filtroPublicado, setFiltroPublicado] = useState("");
  const navigate = useNavigate();

  async function fetchEmpresas() {
    try {
      const data = await listarEmpresas();
      setEmpresas(data || []);
    } catch (err) {
      setError("Error al cargar las empresas. Revisa la conexión con el backend.");
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    fetchEmpresas();
  }, []);

  const resumen = useMemo(() => {
    const pendientes = empresas.filter((empresa) => {
      const estado = normalizeEstado(empresa.estado_empresa);
      return estado === "Pendiente" || estado === "En revisión";
    }).length;

    const aprobadas = empresas.filter((empresa) => normalizeEstado(empresa.estado_empresa) === "Aprobada").length;

    const conCorrecciones = empresas.filter((empresa) => {
      const estado = normalizeEstado(empresa.estado_empresa);
      return estado === "Rechazada" || estado === "Sin estado";
    }).length;

    const renovaciones = empresas.filter((empresa) => {
      if (!empresa.fecha_registro || normalizeEstado(empresa.estado_empresa) !== "Aprobada") {
        return false;
      }

      const fechaRegistro = new Date(empresa.fecha_registro);
      const hoy = new Date();
      const diferenciaDias = (hoy.getTime() - fechaRegistro.getTime()) / (1000 * 60 * 60 * 24);
      return diferenciaDias > 365;
    }).length;

    return {
      pendientes,
      aprobadas,
      conCorrecciones,
      renovaciones,
    };
  }, [empresas]);

  const empresasFiltradas = useMemo(() => {
    let resultado = empresas;

    // Filtrar por búsqueda de nombre
    if (busqueda.trim()) {
      const texto = busqueda.trim().toLowerCase();
      resultado = resultado.filter((empresa) => {
        const nombre = (empresa.nombre_empresa ?? empresa.nombre ?? "").toLowerCase();
        return nombre.includes(texto);
      });
    }

    // Filtrar por estado
    if (filtroEstado) {
      resultado = resultado.filter((empresa) => {
        const estado = normalizeEstado(empresa.estado_empresa);
        return estado === filtroEstado;
      });
    }

    // Filtrar por estado en padrón (si está aprobada y publicada)
    if (filtroPublicado) {
      resultado = resultado.filter((empresa) => {
        const estaPublicado = normalizeEstado(empresa.estado_empresa) === "Aprobada";

        if (filtroPublicado === "Publicado") {
          return estaPublicado;
        }

        if (filtroPublicado === "No publicado") {
          return !estaPublicado;
        }

        return true;
      });
    }

    return resultado;
  }, [empresas, busqueda, filtroEstado, filtroPublicado]);

  async function handleValidarEmpresa(idEmpresa: number) {
    try {
      setValidandoId(idEmpresa);
      await validarEmpresa(idEmpresa);
      await fetchEmpresas();
    } catch (err) {
      setError("No se pudo validar la empresa. Intenta nuevamente.");
    } finally {
      setValidandoId(null);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Gestión de Empresas</h1>
        <p className="text-gray-500 text-sm mt-1">
          Revisión de empresas nuevas, renovaciones, documentación, convenios y padrón empresarial.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          ["Pendientes", resumen.pendientes, Clock, "bg-orange-500"],
          ["Aprobadas", resumen.aprobadas, CheckCircle2, "bg-green-600"],
          ["Con correcciones", resumen.conCorrecciones, AlertTriangle, "bg-red-500"],
          ["Renovaciones", resumen.renovaciones, FileText, "bg-blue-600"],
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
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
            />
          </div>

          <select
            className="border rounded-xl px-3 py-2 text-sm"
            value={filtroEstado}
            onChange={(event) => setFiltroEstado(event.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En revisión">En revisión</option>
            <option value="Aprobada">Aprobada</option>
          </select>

          <select
            className="border rounded-xl px-3 py-2 text-sm"
            value={filtroPublicado}
            onChange={(event) => setFiltroPublicado(event.target.value)}
          >
            <option value="">Estado en padrón</option>
            <option value="Publicado">Publicado</option>
            <option value="No publicado">No publicado</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">Empresas registradas</h3>
          <span className="ml-auto text-xs text-gray-400">
            {cargando ? "Cargando..." : `${empresasFiltradas.length} resultados`}
          </span>
        </div>

        {error ? (
          <div className="p-6 text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Empresa</th>
                  <th>RFC</th>
                  <th>Giro</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {cargando ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      Cargando datos...
                    </td>
                  </tr>
                ) : empresasFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                      No se encontraron empresas para la búsqueda.
                    </td>
                  </tr>
                ) : (
                  empresasFiltradas.map((e: any) => (
                    <tr key={e.id_empresa ?? e.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-[#0d2b5e]">{e.nombre_empresa ?? e.nombre}</div>
                        <div className="text-xs text-gray-400">{e.correo_contacto ?? e.correo}</div>
                      </td>
                      <td className="text-gray-600">{e.rfc}</td>
                      <td className="text-gray-600">{e.giro}</td>
                      <td>
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoColor[normalizeEstado(e.estado_empresa)] ?? "bg-gray-100 text-gray-600"}`}
                        >
                          {normalizeEstado(e.estado_empresa)}
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
                          {e.estado_empresa !== "Aprobada" && (
                            <button
                              onClick={() => handleValidarEmpresa(e.id_empresa)}
                              disabled={validandoId === e.id_empresa}
                              className="bg-green-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-60"
                            >
                              <CheckCircle className="w-3 h-3" />
                              {validandoId === e.id_empresa ? "Validando..." : "Validar"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <p className="text-sm text-[#0d2b5e]">
          Una empresa solo puede publicarse en el padrón cuando su documentación, convenio, plan de trabajo y vacantes han sido revisados.
        </p>
      </div>
    </div>
  );
}
