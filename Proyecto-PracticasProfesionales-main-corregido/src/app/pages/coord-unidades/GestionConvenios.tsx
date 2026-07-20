import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  ClipboardCheck,
  Eye,
  FileText,
  Filter,
  RotateCcw,
  Send,
  Search,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router";

import type { EmpresaRevision } from "../../../domain/coord-unidades/EmpresaRevision";
import { apiClient } from "../../../infrastructure/api/apiClient";
import { gestionEmpresasRevisionUseCase } from "../../dependencies";

import { resolveApiUrl } from "../../../shared/utils/apiUrl";
import { ContextHelp } from "../../../shared/components/ContextHelp";
import type { StatCard } from "../../../shared/types/ui";
type ConvenioApi = {
  id_convenio: number;
  id_empresa: number;
  fecha_inicio: string;
  fecha_fin: string;
  documento_convenio: string | null;
  version: number;
  es_actual: boolean;
  renovacion_solicitada: boolean;
  estado_convenio: "Vigente" | "Vencido" | "Pendiente";
};

type ConvenioVista = ConvenioApi & {
  empresa: string;
  giro: string | null;
  estado_calculado: "Vigente" | "Por vencer" | "Pendiente" | "Vencido";
  dias_restantes: number;
};

const estadoColor: Record<ConvenioVista["estado_calculado"], string> = {
  Vigente: "bg-green-100 text-green-700",
  "Por vencer": "bg-yellow-100 text-yellow-700",
  Pendiente: "bg-orange-100 text-orange-700",
  Vencido: "bg-red-100 text-red-700",
};

function diasEntre(fecha: string) {
  const hoy = new Date();
  const cierre = new Date(`${fecha}T00:00:00`);
  hoy.setHours(0, 0, 0, 0);
  return Math.ceil((cierre.getTime() - hoy.getTime()) / 86400000);
}

function formatearFecha(fecha: string) {
  const date = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function construirConvenios(convenios: ConvenioApi[], empresas: EmpresaRevision[]): ConvenioVista[] {
  return convenios.map((convenio) => {
    const empresa = empresas.find((item) => item.id_empresa === convenio.id_empresa);
    const diasRestantes = diasEntre(convenio.fecha_fin);
    let estadoCalculado: ConvenioVista["estado_calculado"] = convenio.estado_convenio;

    if (convenio.estado_convenio === "Vigente") {
      if (diasRestantes < 0) estadoCalculado = "Vencido";
      else if (diasRestantes <= 30) estadoCalculado = "Por vencer";
    }

    return {
      ...convenio,
      empresa: empresa?.nombre_empresa ?? `Empresa #${convenio.id_empresa}`,
      giro: empresa?.giro ?? null,
      estado_calculado: estadoCalculado,
      dias_restantes: diasRestantes,
    };
  }).sort((a, b) => {
    const prioridad = { "Por vencer": 0, Vencido: 1, Pendiente: 2, Vigente: 3 };
    return prioridad[a.estado_calculado] - prioridad[b.estado_calculado] || a.dias_restantes - b.dias_restantes;
  });
}

export function GestionConvenios() {
  const navigate = useNavigate();
  const [convenios, setConvenios] = useState<ConvenioApi[]>([]);
  const [empresas, setEmpresas] = useState<EmpresaRevision[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState("Todos");
  const [tipo, setTipo] = useState("Todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void cargar();
  }, []);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const [conveniosResponse, empresasData] = await Promise.all([
        apiClient.get<ConvenioApi[]>("/convenios/"),
        gestionEmpresasRevisionUseCase.listar(),
      ]);
      setConvenios(conveniosResponse.data);
      setEmpresas(empresasData);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar los convenios registrados.");
    } finally {
      setCargando(false);
    }
  }

  const conveniosVista = useMemo(() => construirConvenios(convenios, empresas), [convenios, empresas]);

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return conveniosVista.filter((convenio) => {
      const coincideBusqueda =
        !texto ||
        [convenio.empresa, convenio.giro ?? "", convenio.documento_convenio ?? ""].some((valor) =>
          valor.toLowerCase().includes(texto),
        );
      const coincideEstado = estado === "Todos" || convenio.estado_calculado === estado;
      const coincideTipo =
        tipo === "Todos" ||
        (tipo === "Con documento" && Boolean(convenio.documento_convenio)) ||
        (tipo === "Sin documento" && !convenio.documento_convenio);

      return coincideBusqueda && coincideEstado && coincideTipo;
    });
  }, [busqueda, conveniosVista, estado, tipo]);

  const resumen = useMemo(
    () => ({
      vigentes: conveniosVista.filter((c) => c.estado_calculado === "Vigente").length,
      porVencer: conveniosVista.filter((c) => c.estado_calculado === "Por vencer").length,
      pendientes: conveniosVista.filter((c) => c.estado_calculado === "Pendiente").length,
      vencidos: conveniosVista.filter((c) => c.estado_calculado === "Vencido").length,
    }),
    [conveniosVista],
  );

  function limpiarFiltros() {
    setBusqueda("");
    setEstado("Todos");
    setTipo("Todos");
  }

  function obtenerUrlDocumento(documento: string) {
    if (documento.startsWith("http://") || documento.startsWith("https://")) return documento;
    if (documento.startsWith("/")) return resolveApiUrl(documento);
    return resolveApiUrl(`/uploads/convenios/${documento}`);
  }

  function abrirDocumento(convenio: ConvenioVista) {
    if (!convenio.documento_convenio) return;
    window.open(obtenerUrlDocumento(convenio.documento_convenio), "_blank");
  }

  async function solicitarRenovacion(convenio: ConvenioVista) {
    const observaciones = window.prompt(
      "Observaciones para la empresa",
      "Favor de subir la nueva version firmada desde Documentacion.",
    );
    if (observaciones === null) return;

    try {
      setError("");
      await apiClient.patch(`/convenios/${convenio.id_convenio}/solicitar-renovacion`, {
        observaciones: observaciones.trim() || undefined,
      });
      await cargar();
    } catch (err) {
      console.error(err);
      setError("No se pudo iniciar la renovacion del convenio.");
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold text-[#0d2b5e]">Gestion de Convenios</h1>
          <ContextHelp
            title="Ayuda"
            message="En esta pantalla monitoreas vigencias, vencimientos y renovaciones. Un convenio por vencer debe renovarse para que sus vacantes no pierdan publicacion."
          />
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Seguimiento de vigencias generadas desde los convenios firmados del expediente empresarial.
        </p>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 text-sm text-[#0d2b5e]">
        Los convenios se generan cuando coordinacion aprueba el documento de convenio en Expedientes.
        Para renovar, inicia la renovacion y la empresa sube la nueva version desde Documentacion.
      </div>

      {resumen.porVencer > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-yellow-700 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-yellow-800">
              Hay {resumen.porVencer} convenio(s) por vencer.
            </p>
            <p className="text-xs text-yellow-700 mt-1">
              Atiende primero estos registros para evitar que sus vacantes salgan del padron.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {([
          ["Vigentes", resumen.vigentes, CheckCircle2],
          ["Por vencer", resumen.porVencer, Clock],
          ["Pendientes", resumen.pendientes, AlertTriangle],
          ["Vencidos", resumen.vencidos, XCircle],
        ] satisfies StatCard[]).map(([titulo, valor, Icon]) => (
          <div key={titulo} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0d2b5e]">{cargando ? "..." : valor}</div>
              <div className="text-xs text-gray-500">{titulo}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e] text-sm">Filtros de convenios</h3>
          </div>

          <button onClick={limpiarFiltros} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1565c0]">
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="outline-none text-sm w-full"
              placeholder="Buscar empresa o documento..."
            />
          </div>

          <select value={estado} onChange={(e) => setEstado(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white">
            <option>Todos</option>
            <option>Vigente</option>
            <option>Por vencer</option>
            <option>Pendiente</option>
            <option>Vencido</option>
          </select>

          <select value={tipo} onChange={(e) => setTipo(e.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white">
            <option>Todos</option>
            <option>Con documento</option>
            <option>Sin documento</option>
          </select>

          <button
            onClick={cargar}
            className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center justify-center gap-2"
          >
            <ClipboardCheck className="w-4 h-4" />
            Revisar convenios
          </button>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">Convenios registrados</h3>
          <span className="ml-auto text-xs text-gray-400">{filtrados.length} resultados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3">Empresa</th>
                <th>Vigencia</th>
                <th>Estado</th>
                <th>Documento</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filtrados.map((convenio) => (
                <tr key={convenio.id_convenio} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#0d2b5e] flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#1565c0]" />
                      {convenio.empresa}
                    </div>
                    <div className="text-xs text-gray-400">{convenio.giro ?? "Sin giro registrado"}</div>
                    <div className="text-xs text-gray-400 mt-1">
                      Version {convenio.version} · {convenio.es_actual ? "Actual" : "Historico"}
                    </div>
                  </td>

                  <td className="text-gray-600">
                    <div className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-gray-400" />
                      {formatearFecha(convenio.fecha_inicio)} - {formatearFecha(convenio.fecha_fin)}
                    </div>
                    {convenio.estado_calculado === "Por vencer" && (
                      <div className="text-xs text-yellow-700 mt-1 font-semibold">
                        Iniciar renovacion · vence en {convenio.dias_restantes} dias
                      </div>
                    )}
                    {convenio.estado_calculado === "Vencido" && (
                      <div className="text-xs text-red-700 mt-1">Vencido hace {Math.abs(convenio.dias_restantes)} dias</div>
                    )}
                    {convenio.renovacion_solicitada && (
                      <div className="text-xs text-blue-700 mt-1">Renovacion solicitada a la empresa</div>
                    )}
                  </td>

                  <td>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoColor[convenio.estado_calculado]}`}>
                      {convenio.estado_calculado}
                    </span>
                  </td>

                  <td className="text-gray-500 text-xs">
                    {convenio.documento_convenio ? (
                      <div>
                        <div className="font-medium text-gray-700">Expediente documental</div>
                        <div className="max-w-xs truncate">{convenio.documento_convenio}</div>
                      </div>
                    ) : (
                      "Sin documento"
                    )}
                  </td>

                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => abrirDocumento(convenio)}
                        disabled={!convenio.documento_convenio}
                        className="border border-blue-200 text-[#1565c0] rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <Eye className="w-3 h-3" />
                        Ver
                      </button>

                      <button
                        onClick={() => navigate(`/coord-unidades/empresas/${convenio.id_empresa}/expediente`)}
                        className="border border-purple-200 text-purple-600 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
                      >
                        <FileText className="w-3 h-3" />
                        Expediente
                      </button>

                      {convenio.es_actual && convenio.estado_calculado !== "Pendiente" && (
                        <button
                          onClick={() => solicitarRenovacion(convenio)}
                          className="bg-orange-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Iniciar renovacion
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!cargando && filtrados.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    No hay convenios para mostrar. Aprueba el documento de convenio en Expedientes para generarlos.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-orange-600 mt-0.5" />
        <p className="text-sm text-orange-700">
          Una empresa solo debe permanecer disponible en el padron cuando cuenta con convenio vigente, documentacion validada y vacantes activas.
        </p>
      </div>
    </div>
  );
}
