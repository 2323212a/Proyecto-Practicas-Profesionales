import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Eye,
  FileText,
  Globe2,
  Search,
} from "lucide-react";
import {
  listarPadronEmpresarial,
  type PadronEmpresarialApi,
} from "../../../infrastructure/coord-unidades/coordUnidadesApi";

const estadoEmpresaColor: Record<string, string> = {
  Aprobada: "bg-green-100 text-green-700",
  Pendiente: "bg-orange-100 text-orange-700",
  "En Revision": "bg-yellow-100 text-yellow-700",
  Rechazada: "bg-red-100 text-red-700",
  Suspendida: "bg-gray-100 text-gray-600",
  Inactiva: "bg-gray-100 text-gray-600",
};

const estadoConvenioColor: Record<string, string> = {
  Vigente: "bg-green-100 text-green-700",
  Pendiente: "bg-orange-100 text-orange-700",
  Vencido: "bg-red-100 text-red-700",
};

const estadoVacanteColor: Record<string, string> = {
  Aprobada: "bg-green-100 text-green-700",
  Pendiente: "bg-orange-100 text-orange-700",
  Cerrada: "bg-gray-100 text-gray-600",
};

function normalizarEstado(estado?: string | null) {
  return estado || "Sin registro";
}

function esVisibleParaAlumnos(empresa: PadronEmpresarialApi) {
  return (
    empresa.estado_empresa === "Aprobada" &&
    empresa.estado_convenio === "Vigente" &&
    empresa.estado_vacante === "Aprobada"
  );
}

function estaListaParaPublicar(empresa: PadronEmpresarialApi) {
  return (
    empresa.estado_empresa === "Aprobada" &&
    empresa.estado_convenio === "Pendiente"
  );
}

function badgeClass(
  estado: string | null | undefined,
  colores: Record<string, string>,
) {
  return colores[normalizarEstado(estado)] ?? "bg-gray-100 text-gray-600";
}

export function PadronEmpresarial() {
  const [empresas, setEmpresas] = useState<PadronEmpresarialApi[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estadoEmpresa, setEstadoEmpresa] = useState("");
  const [estadoConvenio, setEstadoConvenio] = useState("");
  const [visibilidad, setVisibilidad] = useState("");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargarPadron() {
      try {
        const data = await listarPadronEmpresarial();
        setEmpresas(data || []);
      } catch (err) {
        setError("No se pudo cargar el padron empresarial.");
      } finally {
        setCargando(false);
      }
    }

    cargarPadron();
  }, []);

  const empresasFiltradas = useMemo(() => {
    return empresas.filter((empresa) => {
      const texto = busqueda.trim().toLowerCase();
      const coincideBusqueda =
        !texto ||
        empresa.nombre_empresa.toLowerCase().includes(texto) ||
        empresa.rfc.toLowerCase().includes(texto) ||
        (empresa.titulo ?? "").toLowerCase().includes(texto);

      const coincideEmpresa =
        !estadoEmpresa || empresa.estado_empresa === estadoEmpresa;

      const coincideConvenio =
        !estadoConvenio ||
        normalizarEstado(empresa.estado_convenio) === estadoConvenio;

      const visible = esVisibleParaAlumnos(empresa);
      const coincideVisibilidad =
        !visibilidad ||
        (visibilidad === "Visible" && visible) ||
        (visibilidad === "Oculta" && !visible);

      return (
        coincideBusqueda &&
        coincideEmpresa &&
        coincideConvenio &&
        coincideVisibilidad
      );
    });
  }, [busqueda, empresas, estadoConvenio, estadoEmpresa, visibilidad]);

  const resumen = useMemo(() => {
    const visibles = empresas.filter(esVisibleParaAlumnos).length;
    const listas = empresas.filter(estaListaParaPublicar).length;
    const noPublicables = empresas.length - visibles - listas;

    return {
      visibles,
      listas,
      noPublicables: Math.max(noPublicables, 0),
    };
  }, [empresas]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Padrón Empresarial
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Consulta de empresas registradas como unidades receptoras, sus
          convenios y vacantes.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              className="outline-none text-sm w-full"
              placeholder="Buscar empresa, RFC o vacante..."
            />
          </div>

          <select
            value={estadoEmpresa}
            onChange={(event) => setEstadoEmpresa(event.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option value="">Todos los estados</option>
            <option value="Aprobada">Aprobada</option>
            <option value="Pendiente">Pendiente</option>
            <option value="En Revision">En Revision</option>
            <option value="Rechazada">Rechazada</option>
          </select>

          <select
            value={estadoConvenio}
            onChange={(event) => setEstadoConvenio(event.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option value="">Convenio</option>
            <option value="Vigente">Vigente</option>
            <option value="Pendiente">Pendiente</option>
            <option value="Vencido">Vencido</option>
            <option value="Sin registro">Sin registro</option>
          </select>

          <select
            value={visibilidad}
            onChange={(event) => setVisibilidad(event.target.value)}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option value="">Visibilidad</option>
            <option value="Visible">Visible para alumnos</option>
            <option value="Oculta">Oculta</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <Globe2 className="w-6 h-6 text-green-700" />
            <div>
              <p className="text-2xl font-bold text-green-700">
                {resumen.visibles}
              </p>
              <p className="text-sm text-green-700">Empresas visibles</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-6 h-6 text-blue-700" />
            <div>
              <p className="text-2xl font-bold text-blue-700">
                {resumen.listas}
              </p>
              <p className="text-sm text-blue-700">Listas para publicar</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 border border-orange-200 rounded-2xl p-5">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-6 h-6 text-orange-700" />
            <div>
              <p className="text-2xl font-bold text-orange-700">
                {resumen.noPublicables}
              </p>
              <p className="text-sm text-orange-700">No publicables</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">Empresas en padrón</h3>
          <span className="ml-auto text-xs text-gray-400">
            {cargando ? "Cargando..." : `${empresasFiltradas.length} resultados`}
          </span>
        </div>

        {error ? (
          <div className="p-6 text-sm text-red-600">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr className="text-left text-gray-500">
                  <th className="px-6 py-3">Empresa</th>
                  <th>RFC</th>
                  <th>Estado empresa</th>
                  <th>Convenio</th>
                  <th>Vacante</th>
                  <th>Visibilidad</th>
                  <th>Acciones</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {cargando ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      Cargando padrón empresarial...
                    </td>
                  </tr>
                ) : empresasFiltradas.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-6 py-8 text-center text-gray-500"
                    >
                      No se encontraron empresas en el padrón.
                    </td>
                  </tr>
                ) : (
                  empresasFiltradas.map((empresa) => {
                    const visible = esVisibleParaAlumnos(empresa);

                    return (
                      <tr
                        key={`${empresa.id_empresa}-${empresa.id_convenio ?? "sin-convenio"}-${empresa.id_vacante ?? "sin-vacante"}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-6 py-4">
                          <div className="font-medium text-[#0d2b5e]">
                            {empresa.nombre_empresa}
                          </div>
                          <div className="text-xs text-gray-400">
                            ID empresa: {empresa.id_empresa}
                          </div>
                        </td>

                        <td className="text-gray-600">{empresa.rfc}</td>

                        <td>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${badgeClass(
                              empresa.estado_empresa,
                              estadoEmpresaColor,
                            )}`}
                          >
                            {normalizarEstado(empresa.estado_empresa)}
                          </span>
                        </td>

                        <td>
                          <div className="flex flex-col gap-1">
                            <span
                              className={`w-fit px-3 py-1 rounded-full text-xs font-semibold ${badgeClass(
                                empresa.estado_convenio,
                                estadoConvenioColor,
                              )}`}
                            >
                              {normalizarEstado(empresa.estado_convenio)}
                            </span>
                            <span className="text-xs text-gray-400">
                              {empresa.id_convenio
                                ? `Convenio ${empresa.id_convenio}`
                                : "Sin convenio"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <div className="flex flex-col gap-1">
                            <span className="text-gray-700">
                              {empresa.titulo || "Sin vacante"}
                            </span>
                            <span
                              className={`w-fit px-3 py-1 rounded-full text-xs font-semibold ${badgeClass(
                                empresa.estado_vacante,
                                estadoVacanteColor,
                              )}`}
                            >
                              {normalizarEstado(empresa.estado_vacante)}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              visible
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {visible ? "Visible" : "Oculta"}
                          </span>
                        </td>

                        <td>
                          <button className="border border-blue-200 text-[#1565c0] rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                            {empresa.id_vacante ? (
                              <Eye className="w-3 h-3" />
                            ) : (
                              <FileText className="w-3 h-3" />
                            )}
                            {empresa.id_vacante ? "Ver vacante" : "Sin vacante"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
