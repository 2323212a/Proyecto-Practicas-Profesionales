import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  Globe2,
  Search,
  Send,
  Users,
} from "lucide-react";

import { gestionEmpresasRevisionUseCase, gestionVacantesRevisionUseCase } from "../../dependencies";
import type { EmpresaRevision } from "../../../domain/coord-unidades/EmpresaRevision";
import type { VacanteRevision } from "../../../domain/coord-unidades/VacanteRevision";

type EstadoFiltro = "Todos" | "Publicada" | "Lista para publicar" | "No publicable";
type RequisitoFiltro = "Todos" | "Completos" | "Pendientes";
type VisibilidadFiltro = "Todos" | "Visible" | "Oculta";

type EmpresaPadron = EmpresaRevision & {
  estado_padron: "Publicada" | "Lista para publicar" | "No publicable";
  requisitos: "Completos" | "Pendientes";
  visibilidad: "Visible" | "Oculta";
  vacantes_publicables: VacanteRevision[];
  observacion: string;
};

const estadoColor: Record<EmpresaPadron["estado_padron"], string> = {
  Publicada: "bg-green-100 text-green-700",
  "Lista para publicar": "bg-blue-100 text-blue-700",
  "No publicable": "bg-orange-100 text-orange-700",
};

const requisitoColor: Record<EmpresaPadron["requisitos"], string> = {
  Completos: "bg-green-100 text-green-700",
  Pendientes: "bg-orange-100 text-orange-700",
};

function construirPadron(empresas: EmpresaRevision[], vacantes: VacanteRevision[]): EmpresaPadron[] {
  return empresas.map((empresa) => {
    const vacantesEmpresa = vacantes.filter((vacante) => vacante.id_empresa === empresa.id_empresa);
    const vacantesPublicables = vacantesEmpresa.filter((vacante) => vacante.publicable);
    const visibles = vacantesEmpresa.filter((vacante) => vacante.estado_vacante === "Activa");
    const aprobada = empresa.estado_empresa === "Aprobada";
    const requisitos: EmpresaPadron["requisitos"] =
      aprobada && empresa.vacantes_activas > 0 ? "Completos" : "Pendientes";

    let estado: EmpresaPadron["estado_padron"] = "No publicable";
    let observacion = "Requiere aprobacion de empresa, convenio/documentacion o vacantes activas.";

    if (visibles.length > 0) {
      estado = "Publicada";
      observacion = "Disponible para seleccion de alumnos.";
    } else if (aprobada && vacantesPublicables.length > 0) {
      estado = "Lista para publicar";
      observacion = "Lista para mostrarse en el catalogo del alumno.";
    }

    return {
      ...empresa,
      estado_padron: estado,
      requisitos,
      visibilidad: visibles.length > 0 ? "Visible" : "Oculta",
      vacantes_publicables: vacantesPublicables,
      observacion,
    };
  });
}

export function PadronEmpresarial() {
  const [empresas, setEmpresas] = useState<EmpresaRevision[]>([]);
  const [vacantes, setVacantes] = useState<VacanteRevision[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [estado, setEstado] = useState<EstadoFiltro>("Todos");
  const [requisitos, setRequisitos] = useState<RequisitoFiltro>("Todos");
  const [visibilidad, setVisibilidad] = useState<VisibilidadFiltro>("Todos");
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void cargar();
  }, []);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      const [empresasData, vacantesData] = await Promise.all([
        gestionEmpresasRevisionUseCase.listar(),
        gestionVacantesRevisionUseCase.listar(),
      ]);
      setEmpresas(empresasData);
      setVacantes(vacantesData);
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el padron empresarial.");
    } finally {
      setCargando(false);
    }
  }

  const empresasPadron = useMemo(() => construirPadron(empresas, vacantes), [empresas, vacantes]);

  const filtradas = useMemo(() => {
    const texto = busqueda.trim().toLowerCase();

    return empresasPadron.filter((empresa) => {
      const coincideBusqueda =
        !texto ||
        [empresa.nombre_empresa, empresa.giro ?? "", empresa.rfc ?? ""].some((valor) =>
          valor.toLowerCase().includes(texto),
        );
      const coincideEstado = estado === "Todos" || empresa.estado_padron === estado;
      const coincideRequisitos = requisitos === "Todos" || empresa.requisitos === requisitos;
      const coincideVisibilidad = visibilidad === "Todos" || empresa.visibilidad === visibilidad;

      return coincideBusqueda && coincideEstado && coincideRequisitos && coincideVisibilidad;
    });
  }, [busqueda, empresasPadron, estado, requisitos, visibilidad]);

  const resumen = useMemo(
    () => ({
      visibles: empresasPadron.filter((empresa) => empresa.visibilidad === "Visible").length,
      listas: empresasPadron.filter((empresa) => empresa.estado_padron === "Lista para publicar").length,
      noPublicables: empresasPadron.filter((empresa) => empresa.estado_padron === "No publicable").length,
    }),
    [empresasPadron],
  );

  async function publicarEmpresa(empresa: EmpresaPadron) {
    try {
      await Promise.all(
        empresa.vacantes_publicables.map((vacante) =>
          gestionVacantesRevisionUseCase.cambiarEstado(vacante.id_vacante, "Activa"),
        ),
      );
      await cargar();
    } catch (err) {
      console.error(err);
      setError("No se pudieron publicar las vacantes de la empresa.");
    }
  }

  async function ocultarEmpresa(empresa: EmpresaPadron) {
    try {
      const activas = vacantes.filter(
        (vacante) => vacante.id_empresa === empresa.id_empresa && vacante.estado_vacante === "Activa",
      );
      await Promise.all(
        activas.map((vacante) =>
          gestionVacantesRevisionUseCase.cambiarEstado(vacante.id_vacante, "Inactiva"),
        ),
      );
      await cargar();
    } catch (err) {
      console.error(err);
      setError("No se pudieron ocultar las vacantes de la empresa.");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">Padron Empresarial</h1>
          <p className="text-gray-500 text-sm mt-1">
            Control de empresas visibles para alumnos dentro del catalogo de unidades receptoras.
          </p>
        </div>

        <button
          onClick={cargar}
          className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          Actualizar padron
        </button>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              className="outline-none text-sm w-full"
              placeholder="Buscar empresa..."
            />
          </div>

          <select value={estado} onChange={(event) => setEstado(event.target.value as EstadoFiltro)} className="border rounded-xl px-3 py-2 text-sm bg-white">
            <option>Todos</option>
            <option>Publicada</option>
            <option>Lista para publicar</option>
            <option>No publicable</option>
          </select>

          <select value={requisitos} onChange={(event) => setRequisitos(event.target.value as RequisitoFiltro)} className="border rounded-xl px-3 py-2 text-sm bg-white">
            <option>Todos</option>
            <option>Completos</option>
            <option>Pendientes</option>
          </select>

          <select value={visibilidad} onChange={(event) => setVisibilidad(event.target.value as VisibilidadFiltro)} className="border rounded-xl px-3 py-2 text-sm bg-white">
            <option>Todos</option>
            <option>Visible</option>
            <option>Oculta</option>
          </select>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          ["Empresas visibles", resumen.visibles, Globe2, "bg-green-50 border-green-200 text-green-700"],
          ["Listas para publicar", resumen.listas, CheckCircle2, "bg-blue-50 border-blue-200 text-blue-700"],
          ["No publicables", resumen.noPublicables, AlertTriangle, "bg-orange-50 border-orange-200 text-orange-700"],
        ].map(([titulo, valor, Icon, color]: any) => (
          <div key={titulo} className={`${color} border rounded-2xl p-5`}>
            <div className="flex items-center gap-3">
              <Icon className="w-6 h-6" />
              <div>
                <p className="text-2xl font-bold">{cargando ? "..." : valor}</p>
                <p className="text-sm">{titulo}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">Empresas en padron</h3>
          <span className="ml-auto text-xs text-gray-400">{filtradas.length} resultados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3">Empresa</th>
                <th>Requisitos</th>
                <th>Vacantes</th>
                <th>Estado</th>
                <th>Visibilidad</th>
                <th>Observacion</th>
                <th>Acciones</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {filtradas.map((empresa) => (
                <tr key={empresa.id_empresa} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#0d2b5e]">{empresa.nombre_empresa}</div>
                    <div className="text-xs text-gray-400">{empresa.giro ?? "Sin giro registrado"}</div>
                  </td>

                  <td>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${requisitoColor[empresa.requisitos]}`}>
                      {empresa.requisitos}
                    </span>
                  </td>

                  <td className="text-gray-600">
                    {empresa.vacantes_activas} espacios activos
                  </td>

                  <td>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoColor[empresa.estado_padron]}`}>
                      {empresa.estado_padron}
                    </span>
                  </td>

                  <td>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${empresa.visibilidad === "Visible" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}>
                      {empresa.visibilidad}
                    </span>
                  </td>

                  <td className="text-gray-600 max-w-xs">{empresa.observacion}</td>

                  <td>
                    <div className="flex flex-wrap gap-2">
                      <button className="border border-blue-200 text-[#1565c0] rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        Vista alumno
                      </button>

                      {empresa.estado_padron === "Lista para publicar" && (
                        <button
                          onClick={() => publicarEmpresa(empresa)}
                          className="bg-green-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" />
                          Publicar
                        </button>
                      )}

                      {empresa.visibilidad === "Visible" && (
                        <button
                          onClick={() => ocultarEmpresa(empresa)}
                          className="border border-orange-200 text-orange-600 rounded-lg px-3 py-1.5 text-xs font-semibold flex items-center gap-1"
                        >
                          <EyeOff className="w-3 h-3" />
                          Ocultar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}

              {!cargando && filtradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-gray-400">
                    No hay empresas que coincidan con los filtros seleccionados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-[#1565c0] mt-0.5" />
          <p className="text-sm text-[#0d2b5e]">
            El padron empresarial se alimenta de empresas aprobadas y vacantes publicables. Solo las vacantes activas quedan visibles para alumnos.
          </p>
        </div>
      </div>
    </div>
  );
}
