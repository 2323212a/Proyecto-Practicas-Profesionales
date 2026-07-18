import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Globe2,
  Send,
  Users,
} from "lucide-react";

import { gestionEmpresasRevisionUseCase, gestionVacantesRevisionUseCase } from "../../dependencies";
import type { EmpresaRevision } from "../../../domain/coord-unidades/EmpresaRevision";
import type { VacanteRevision } from "../../../domain/coord-unidades/VacanteRevision";

import type { ColoredStatCard } from "../../../shared/types/ui";
type EmpresaPadron = EmpresaRevision & {
  estado_padron: "Publicada" | "Lista para publicar" | "No publicable";
  requisitos: "Completos" | "Pendientes";
  visibilidad: "Visible" | "Oculta";
  vacantes_publicables: VacanteRevision[];
  observacion: string;
};

function construirPadron(empresas: EmpresaRevision[], vacantes: VacanteRevision[]): EmpresaPadron[] {
  return empresas.map((empresa) => {
    const vacantesEmpresa = vacantes.filter((vacante) => vacante.id_empresa === empresa.id_empresa);
    const vacantesPublicables = vacantesEmpresa.filter((vacante) => vacante.publicable);
    const visibles = vacantesEmpresa.filter((vacante) => vacante.estado_vacante === "Activa");
    const aprobada = empresa.estado_empresa === "Activa";
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
  const [tab, setTab] = useState<"PrePadron" | "Activa">("PrePadron");
  const [convocatoria, setConvocatoria] = useState("Todas");
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

  const resumen = useMemo(
    () => ({
      visibles: empresasPadron.filter((empresa) => empresa.visibilidad === "Visible").length,
      listas: empresasPadron.filter((empresa) => empresa.estado_padron === "Lista para publicar").length,
      noPublicables: empresasPadron.filter((empresa) => empresa.estado_padron === "No publicable").length,
      prepadron: vacantes.filter((vacante) => vacante.estado_vacante === "PrePadron").length,
      publicadas: vacantes.filter((vacante) => vacante.estado_vacante === "Activa").length,
    }),
    [empresasPadron, vacantes],
  );

  const vacantesPadron = useMemo(
    () =>
      vacantes.filter(
        (vacante) =>
          vacante.estado_vacante === tab &&
          (convocatoria === "Todas" || String(vacante.id_convocatoria) === convocatoria),
      ),
    [tab, vacantes, convocatoria],
  );

  const convocatorias = useMemo(
    () =>
      Array.from(
        new Map(
          vacantes.map((vacante) => [
            vacante.id_convocatoria,
            vacante.convocatoria ?? `Convocatoria ${vacante.id_convocatoria}`,
          ]),
        ),
      ),
    [vacantes],
  );

  async function liberarPrepadron() {
    if (resumen.prepadron === 0) return;
    if (!window.confirm("Las vacantes en pre-padron pasaran a publicadas y seran visibles para alumnos si cumplen las reglas de publicacion.")) {
      return;
    }
    try {
      setError("");
      await gestionVacantesRevisionUseCase.liberarPrepadron(
        convocatoria === "Todas" ? undefined : Number(convocatoria),
      );
      await cargar();
    } catch (err) {
      console.error(err);
      setError("No se pudo liberar el pre-padron.");
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
          onClick={liberarPrepadron}
          disabled={resumen.prepadron === 0}
          className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          Liberar padron a alumnos
        </button>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 text-orange-700 rounded-xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-4">
        {([
          ["Vacantes en pre-padron", resumen.prepadron, CheckCircle2, "bg-blue-50 border-blue-200 text-blue-700"],
          ["Vacantes publicadas", resumen.publicadas, Globe2, "bg-green-50 border-green-200 text-green-700"],
          ["No publicables", resumen.noPublicables, AlertTriangle, "bg-orange-50 border-orange-200 text-orange-700"],
        ] satisfies ColoredStatCard[]).map(([titulo, valor, Icon, color]) => (
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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-3 flex flex-wrap gap-2">
        {[
          ["PrePadron", "Pre-padron"],
          ["Activa", "Publicadas"],
        ].map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id as "PrePadron" | "Activa")}
            className={`px-4 py-2 rounded-xl text-sm font-semibold ${
              tab === id ? "bg-[#0d2b5e] text-white" : "text-[#0d2b5e] hover:bg-blue-50"
            }`}
          >
            {label}
          </button>
        ))}
        <select
          value={convocatoria}
          onChange={(event) => setConvocatoria(event.target.value)}
          className="ml-auto border rounded-xl px-3 py-2 text-sm bg-white"
        >
          <option value="Todas">Todas las convocatorias</option>
          {convocatorias.map(([id, nombre]) => (
            <option key={id} value={String(id)}>
              {nombre}
            </option>
          ))}
        </select>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-[#1565c0] mt-0.5" />
          <p className="text-sm text-[#0d2b5e]">
            Las vacantes en pre-padron no son visibles para alumnos. Al liberar el padron, se publican las vacantes que cumplan las reglas de publicacion.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Building2 className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">{tab === "PrePadron" ? "Vacantes en pre-padron" : "Vacantes publicadas"}</h3>
          <span className="ml-auto text-xs text-gray-400">{vacantesPadron.length} resultados</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr className="text-left text-gray-500">
                <th className="px-6 py-3">Empresa</th>
                <th>Vacante</th>
                <th>Convocatoria</th>
                <th>Cupos</th>
                <th>Estado</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100">
              {vacantesPadron.map((vacante) => (
                <tr key={vacante.id_vacante} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <div className="font-medium text-[#0d2b5e]">{vacante.empresa}</div>
                    <div className="text-xs text-gray-400">{vacante.tipo_practica ?? "Sin tipo de practica"}</div>
                  </td>

                  <td className="text-gray-600">{vacante.titulo}</td>
                  <td className="text-gray-600">{vacante.convocatoria ?? "Sin convocatoria"}</td>
                  <td className="text-gray-600">{vacante.cupos}</td>

                  <td>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      {vacante.estado_vacante}
                    </span>
                  </td>
                </tr>
              ))}

              {!cargando && vacantesPadron.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-gray-400">
                    No hay vacantes en esta seccion.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
