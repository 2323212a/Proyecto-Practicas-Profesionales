import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  Clock,
  Eye,
  Search,
  Send,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router";
import axios from "axios";

import { gestionEmpresasRevisionUseCase } from "../../dependencies";
import type { EmpresaRevision, SolicitudEmpresaDetalle } from "../../../domain/coord-unidades/EmpresaRevision";

import type { ColoredStatCard } from "../../../shared/types/ui";
const estadoColor: Record<string, string> = {
  Pendiente: "bg-orange-100 text-orange-700",
  Activa: "bg-green-100 text-green-700",
  Suspendida: "bg-red-100 text-red-700",
  Inactiva: "bg-gray-100 text-gray-600",
  Solicitante: "bg-blue-100 text-blue-700",
  Rechazada: "bg-red-100 text-red-700",
};

const padronColor: Record<string, string> = {
  Publicado: "bg-green-100 text-green-700",
  "No publicado": "bg-gray-100 text-gray-600",
};

function formatearFecha(valor: string | null) {
  if (!valor) return "Sin registro";
  const fecha = new Date(valor);
  if (Number.isNaN(fecha.getTime())) return "Sin registro";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(fecha);
}

export function ValidacionEmpresas() {
  const navigate = useNavigate();
  const [empresas, setEmpresas] = useState<EmpresaRevision[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [cargando, setCargando] = useState(true);
  const [procesando, setProcesando] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("Solicitudes");
  const [solicitudDetalle, setSolicitudDetalle] = useState<SolicitudEmpresaDetalle | null>(null);

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
      setError("");
      await gestionEmpresasRevisionUseCase.cambiarEstado(empresa.id_empresa, nuevoEstado);
      await cargarEmpresas();
    } catch (err) {
      console.error(err);
      if (axios.isAxiosError(err)) {
        setError(err.response?.data?.detail ?? "No se pudo actualizar la empresa.");
      } else {
        setError("No se pudo actualizar la empresa.");
      }
    } finally {
      setProcesando(null);
    }
  }

  async function verSolicitud(idEmpresa: number) {
    try {
      setError("");
      setSolicitudDetalle(await gestionEmpresasRevisionUseCase.obtenerSolicitud(idEmpresa));
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar la solicitud.");
    }
  }

  async function aceptarSolicitud(empresa: EmpresaRevision) {
    if (!window.confirm("Dar de alta usuario solo permite que la empresa ingrese al sistema y suba documentos. No significa que este activa ni publicada para alumnos.")) {
      return;
    }
    try {
      setProcesando(empresa.id_empresa);
      const respuesta = await gestionEmpresasRevisionUseCase.aceptarSolicitud(empresa.id_empresa);
      alert(`Cuenta creada\nCorreo: ${respuesta.correo}\nContrasena temporal: ${respuesta.password_temporal ?? "Ya tenia cuenta"}`);
      await cargarEmpresas();
    } catch (err) {
      console.error(err);
      setError(axios.isAxiosError(err) ? err.response?.data?.detail ?? "No se pudo aceptar la solicitud." : "No se pudo aceptar la solicitud.");
    } finally {
      setProcesando(null);
    }
  }

  async function rechazarSolicitud(empresa: EmpresaRevision) {
    const motivo = window.prompt("Motivo de rechazo");
    if (!motivo?.trim()) {
      return;
    }
    const observaciones = window.prompt("Observaciones adicionales (opcional)", "");
    try {
      setProcesando(empresa.id_empresa);
      await gestionEmpresasRevisionUseCase.rechazarSolicitud(
        empresa.id_empresa,
        motivo.trim(),
        observaciones?.trim() || undefined,
      );
      await cargarEmpresas();
    } catch (err) {
      console.error(err);
      setError(axios.isAxiosError(err) ? err.response?.data?.detail ?? "No se pudo rechazar la solicitud." : "No se pudo rechazar la solicitud.");
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
      const coincideTab =
        tab === "Solicitudes"
          ? empresa.estado_empresa === "Solicitante"
          : tab === "En proceso"
            ? empresa.estado_empresa === "Pendiente"
            : tab === "Historial"
              ? ["Rechazada", "Suspendida", "Inactiva"].includes(empresa.estado_empresa)
              : false;
      return coincideBusqueda && coincideEstado && coincideTab;
    });
  }, [empresas, busqueda, estado, tab]);

  const resumen = {
    solicitudes: empresas.filter((empresa) => empresa.estado_empresa === "Solicitante").length,
    pendientes: empresas.filter((empresa) => empresa.estado_empresa === "Pendiente").length,
    activas: empresas.filter((empresa) => empresa.estado_empresa === "Activa").length,
    suspendidas: empresas.filter((empresa) => empresa.estado_empresa === "Suspendida").length,
    declinadas: empresas.filter((empresa) => ["Rechazada", "Inactiva"].includes(empresa.estado_empresa)).length,
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
        {([
          ["Solicitudes", resumen.solicitudes, Clock, "bg-blue-600"],
          ["En proceso", resumen.pendientes, Clock, "bg-orange-500"],
          ["Suspendidas", resumen.suspendidas, AlertTriangle, "bg-red-500"],
          ["Rechazadas", resumen.declinadas, XCircle, "bg-gray-600"],
        ] satisfies ColoredStatCard[]).map(([titulo, valor, Icon, color]) => (
          <div key={titulo} className={`${color} rounded-2xl p-5 text-white`}>
            <Icon className="w-7 h-7 mb-3 opacity-80" />
            <div className="text-2xl font-bold">{cargando ? "..." : valor}</div>
            <div className="text-white/80 text-sm">{titulo}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex flex-wrap gap-2 mb-4">
          {["Solicitudes", "En proceso", "Historial"].map((item) => (
            <button
              key={item}
              onClick={() => setTab(item)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border ${tab === item ? "bg-[#0d2b5e] text-white border-[#0d2b5e]" : "bg-white text-[#0d2b5e] border-blue-100"}`}
            >
              {item}
            </button>
          ))}
        </div>
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
            <option>Solicitante</option>
            <option>Pendiente</option>
            <option>Activa</option>
            <option>Rechazada</option>
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
                <th>Tramite</th>
                <th>Vacantes</th>
                <th>Estado</th>
                <th>Padron</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {cargando && (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
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
                    <td className="text-gray-600">
                      {empresa.tipo_tramite ?? "Sin tramite"}
                      <div className="text-xs text-gray-400">{empresa.periodo_participacion ?? "Sin periodo"}</div>
                    </td>
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
                          onClick={() => verSolicitud(empresa.id_empresa)}
                          className="border border-blue-200 text-[#1565c0] rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Ver solicitud
                        </button>

                        {empresa.estado_empresa !== "Solicitante" && (
                          <button
                            onClick={() => navigate(`/coord-unidades/empresas/${empresa.id_empresa}/expediente`)}
                            className="border border-blue-200 text-[#1565c0] rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            Ver expediente
                          </button>
                        )}

                        {empresa.estado_empresa === "Solicitante" && (
                          <button
                            onClick={() => aceptarSolicitud(empresa)}
                            disabled={procesando === empresa.id_empresa}
                            className="bg-green-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                          >
                            <Send className="w-3 h-3" />
                            Aceptar y crear cuenta
                          </button>
                        )}

                        {empresa.estado_empresa === "Solicitante" && (
                          <button
                            onClick={() => rechazarSolicitud(empresa)}
                            disabled={procesando === empresa.id_empresa}
                            className="border border-red-200 text-red-600 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                          >
                            <XCircle className="w-3 h-3" />
                            Rechazar
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
                  <td colSpan={7} className="px-6 py-10 text-center text-gray-400">
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
          Una empresa solicitante aun no tiene expediente documental. El expediente se habilita despues de aceptar la solicitud y crear la cuenta.
        </p>
      </div>

      {solicitudDetalle && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full p-6 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h3 className="font-bold text-[#0d2b5e] text-lg">{solicitudDetalle.empresa.nombre_empresa}</h3>
                <p className="text-sm text-gray-500">{solicitudDetalle.empresa.rfc ?? "Sin RFC"} - {solicitudDetalle.empresa.correo_contacto ?? "Sin correo"}</p>
              </div>
              <button onClick={() => setSolicitudDetalle(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <p><b>Giro:</b> {solicitudDetalle.empresa.giro ?? "Sin giro"}</p>
              <p><b>Telefono:</b> {solicitudDetalle.empresa.telefono ?? "Sin telefono"}</p>
              <p><b>Tramite:</b> {solicitudDetalle.solicitud.tipo_tramite ?? "Sin tramite"}</p>
              <p><b>Periodo:</b> {solicitudDetalle.solicitud.periodo_participacion ?? "Sin periodo"}</p>
              <p><b>Estado solicitud:</b> {solicitudDetalle.solicitud.estado_solicitud ?? "Sin solicitud"}</p>
              <p><b>Cuenta creada:</b> {solicitudDetalle.cuenta_creada ? solicitudDetalle.correo_usuario : "No"}</p>
              <p><b>Fecha solicitud:</b> {formatearFecha(solicitudDetalle.solicitud.fecha_solicitud)}</p>
              <p><b>Ultima revision:</b> {formatearFecha(solicitudDetalle.solicitud.fecha_revision)}</p>
            </div>
            <p className="text-sm"><b>Domicilio:</b> {solicitudDetalle.empresa.domicilio ?? "Sin domicilio"}</p>
            {solicitudDetalle.solicitud.observaciones && <p className="text-sm"><b>Observaciones:</b> {solicitudDetalle.solicitud.observaciones}</p>}
            {solicitudDetalle.solicitud.motivo_rechazo && <p className="text-sm text-red-600"><b>Motivo rechazo:</b> {solicitudDetalle.solicitud.motivo_rechazo}</p>}
            <div className="flex justify-end gap-2">
              {solicitudDetalle.empresa.estado_empresa === "Solicitante" && (
                <>
                  <button onClick={() => aceptarSolicitud(solicitudDetalle.empresa)} className="bg-green-600 text-white rounded-lg px-4 py-2 text-sm font-semibold">
                    Aceptar y crear cuenta
                  </button>
                  <button onClick={() => rechazarSolicitud(solicitudDetalle.empresa)} className="border border-red-200 text-red-600 rounded-lg px-4 py-2 text-sm font-semibold">
                    Rechazar solicitud
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
