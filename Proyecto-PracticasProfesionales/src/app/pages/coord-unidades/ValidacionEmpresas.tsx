import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router";

import { gestionEmpresasRevisionUseCase } from "../../dependencies";
import type { EmpresaRevision } from "../../../domain/coord-unidades/EmpresaRevision";

const estadoColor: Record<string, string> = {
  Pendiente: "bg-orange-100 text-orange-700",
  Activa: "bg-green-100 text-green-700",
  Suspendida: "bg-red-100 text-red-700",
  Inactiva: "bg-gray-100 text-gray-600",
};

const padronColor: Record<string, string> = {
  Publicado: "bg-green-100 text-green-700",
  "No publicado": "bg-gray-100 text-gray-600",
};

export function ValidacionEmpresas() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<EmpresaRevision[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void cargarEmpresas();
  }, []);

  async function cargarEmpresas() {
    try {
      setCargando(true);
      setError("");
      setEmpresas(await gestionEmpresasRevisionUseCase.listar());
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las empresas.");
    } finally {
      setCargando(false);
    }
  }

  async function cambiarEstado(empresa: EmpresaRevision, nuevoEstado: string) {
    try {
      setProcesando(empresa.id_empresa);
      await gestionEmpresasRevisionUseCase.cambiarEstado(empresa.id_empresa, nuevoEstado);
      await cargarEmpresas();
    } catch (err) {
      console.error(err);
      alert("No se pudo actualizar la empresa.");
    } finally {
      setProcesando(null);
    }
  }

  const filtradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return empresas.filter((empresa) => {
      const coincideBusqueda =
        empresa.nombre_empresa.toLowerCase().includes(q) ||
        (empresa.giro ?? "").toLowerCase().includes(q) ||
        (empresa.correo_contacto ?? "").toLowerCase().includes(q) ||
        (empresa.rfc ?? "").toLowerCase().includes(q);
      const coincideEstado = estado === "Todos" || empresa.estado_empresa === estado;
      return coincideBusqueda && coincideEstado;
    });
  }, [empresas, busqueda, estado]);

  const resumen = {
    pendientes: empresas.filter((empresa) => empresa.estado_empresa === "Pendiente").length,
    activas: empresas.filter((empresa) => empresa.estado_empresa === "Activa").length,
    suspendidas: empresas.filter((empresa) => empresa.estado_empresa === "Suspendida").length,
    declinadas: empresas.filter((empresa) => empresa.estado_empresa === "Inactiva").length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Gestion de Empresas</h1>
        <p className="text-gray-500 text-sm mt-1">
          Revision de solicitudes, unidades receptoras y publicacion en el padron empresarial.
        </p>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        {[
          ["Pendientes", resumen.pendientes, Clock, "bg-orange-500"],
          ["Activas", resumen.activas, CheckCircle2, "bg-green-600"],
          ["Suspendidas", resumen.suspendidas, AlertTriangle, "bg-red-500"],
          ["Declinadas", resumen.declinadas, XCircle, "bg-gray-600"],
        ].map(([titulo, valor, Icon, color]: any) => (
          <div key={titulo} className={`${color} rounded-2xl p-5 text-white`}>
            <Icon className="w-7 h-7 mb-3 opacity-80" />
            <div className="text-2xl font-bold">{cargando ? "..." : valor}</div>
            <div className="text-white/80 text-sm">{titulo}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="grid md:grid-cols-2 gap-4">
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="outline-none text-sm w-full"
              placeholder="Buscar empresa, giro, RFC o correo..."
            />
          </div>

          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option>Todos</option>
            <option>Pendiente</option>
            <option>Activa</option>
            <option>Suspendida</option>
            <option>Inactiva</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">Empresas registradas</h3>
          <span className="ml-auto text-xs text-gray-400">{filtradas.length} resultados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3">Empresa</th>
                <th>Giro</th>
                <th>Vacantes</th>
                <th>Estado</th>
                <th>Padron</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {cargando && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                    Cargando empresas...
                  </td>
                </tr>
              )}

              {!cargando &&
                filtradas.map((empresa) => (
                  <tr key={empresa.id_empresa} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="font-medium text-[#0d2b5e]">{empresa.nombre_empresa}</div>
                      <div className="text-xs text-gray-400">
                        {empresa.correo_contacto ?? "Sin correo"} - {empresa.telefono ?? "Sin telefono"}
                      </div>
                    </td>

                    <td className="text-gray-600">{empresa.giro ?? "Sin giro"}</td>
                    <td className="text-gray-600">{empresa.vacantes_activas}/{empresa.vacantes} activas</td>

                    <td>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoColor[empresa.estado_empresa] ?? "bg-gray-100 text-gray-600"}`}>
                        {empresa.estado_empresa}
                      </span>
                    </td>

                    <td>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${padronColor[empresa.padron] ?? "bg-gray-100 text-gray-600"}`}>
                        {empresa.padron}
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

                        {empresa.estado_empresa !== "Activa" && (
                          <button
                            onClick={() => cambiarEstado(empresa, "Activa")}
                            disabled={procesando === empresa.id_empresa}
                            className="bg-green-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            Aprobar
                          </button>
                        )}

                        {empresa.estado_empresa === "Pendiente" && (
                          <button
                            onClick={() => cambiarEstado(empresa, "Inactiva")}
                            disabled={procesando === empresa.id_empresa}
                            className="border border-red-200 text-red-600 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" />
                            Declinar
                          </button>
                        )}

                        {empresa.estado_empresa === "Activa" && (
                          <button
                            onClick={() => cambiarEstado(empresa, "Suspendida")}
                            disabled={procesando === empresa.id_empresa}
                            className="border border-red-200 text-red-600 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" />
                            Suspender
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}

              {!cargando && filtradas.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                    No se encontraron empresas con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <p className="text-sm text-[#0d2b5e]">
          Una empresa aparece en el padron del alumno cuando esta en estado Activa y tiene vacantes activas con cupos disponibles.
        </p>
      </div>
    </div>
  );
}
