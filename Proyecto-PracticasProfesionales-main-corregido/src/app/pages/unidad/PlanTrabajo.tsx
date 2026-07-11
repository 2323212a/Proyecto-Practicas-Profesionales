import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import {
  AlertTriangle,
  Briefcase,
  CheckCircle,
  ClipboardList,
  Eye,
  Lock,
  Plus,
  Search,
  Users,
  XCircle,
} from "lucide-react";

import { gestionVacantesUnidadUseCase } from "../../dependencies";
import { apiClient } from "../../../infrastructure/api/apiClient";
import type {
  CarreraBasica,
  CrearVacanteUnidadInput,
  VacanteUnidad,
  VacantesUnidadResponse,
} from "../../../domain/unidad/VacanteUnidad";

import type { ColoredStatCard } from "../../../shared/types/ui";
type TipoPractica = {
  id_tipo_practica: number;
  nombre: string;
  horas_requeridas: number;
  activo: boolean;
};

type VacanteForm = CrearVacanteUnidadInput & {
  periodo: "Semestral" | "Cuatrimestral";
  id_tipo_practica: number;
};

type UsuarioSesion = {
  perfil?: {
    id_empresa?: number;
  };
};

function obtenerIdEmpresa() {
  const raw = localStorage.getItem("usuario");
  if (!raw) return null;

  try {
    const usuario = JSON.parse(raw) as UsuarioSesion;
    return usuario.perfil?.id_empresa ?? null;
  } catch {
    return null;
  }
}

export function PlanTrabajo() {
  const [datos, setDatos] = useState<VacantesUnidadResponse | null>(null);
  const [carreras, setCarreras] = useState<CarreraBasica[]>([]);
  const [tiposPractica, setTiposPractica] = useState<TipoPractica[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState("");
  const [busqueda, setBusqueda] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [form, setForm] = useState<VacanteForm>({
    id_carrera: 0,
    id_tipo_practica: 0,
    periodo: "Semestral",
    titulo: "",
    descripcion: "",
    modalidad: "Presencial",
    horario: "",
    cupo_total: 1,
  });

  const idEmpresa = obtenerIdEmpresa();

  useEffect(() => {
    void cargar();
  }, [idEmpresa]); // eslint-disable-line react-hooks/exhaustive-deps -- cargar only reads the current company id.

  async function cargar() {
    if (!idEmpresa) {
      setError("No se encontro la empresa asociada a esta sesion.");
      setCargando(false);
      return;
    }

    try {
      setCargando(true);
      setError("");
      const [vacantesData, carrerasData, tiposData] = await Promise.all([
        gestionVacantesUnidadUseCase.listar(idEmpresa),
        gestionVacantesUnidadUseCase.listarCarreras(),
        apiClient.get<TipoPractica[]>("/tipos-practica/"),
      ]);
      setDatos(vacantesData);
      setCarreras(carrerasData);
      setTiposPractica(tiposData.data);
      setForm((actual) => ({
        ...actual,
        id_carrera: actual.id_carrera || carrerasData[0]?.id_carrera || 0,
        id_tipo_practica: actual.id_tipo_practica || tiposData.data[0]?.id_tipo_practica || 0,
      }));
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las vacantes de la empresa.");
    } finally {
      setCargando(false);
    }
  }

  async function crearVacante(event: FormEvent) {
    event.preventDefault();
    if (!idEmpresa || !datos?.empresa.puede_capturar_vacantes) return;

    try {
      setGuardando(true);
      setError("");
      await gestionVacantesUnidadUseCase.crear(idEmpresa, {
        ...form,
        titulo: form.titulo.trim(),
        descripcion: form.descripcion?.trim() || undefined,
        horario: form.horario?.trim() || undefined,
        cupo_total: Number(form.cupo_total),
      });
      setMostrarFormulario(false);
      setForm({
        id_carrera: carreras[0]?.id_carrera || 0,
        id_tipo_practica: tiposPractica[0]?.id_tipo_practica || 0,
        periodo: "Semestral",
        titulo: "",
        descripcion: "",
        modalidad: "Presencial",
        horario: "",
        cupo_total: 1,
      });
      await cargar();
    } catch (err) {
      console.error(err);
      setError("No se pudo crear la vacante. Verifica que tengas documentacion legal aprobada y convenio vigente.");
    } finally {
      setGuardando(false);
    }
  }

  const vacantesFiltradas = useMemo(() => {
    const q = busqueda.toLowerCase();
    return (datos?.vacantes ?? []).filter((vacante) =>
      [vacante.titulo, vacante.carrera ?? "", vacante.modalidad, vacante.descripcion ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [busqueda, datos]);

  const total = datos?.vacantes.length ?? 0;
  const visibles = datos?.vacantes.filter((vacante) => vacante.visible_padron).length ?? 0;
  const cerradas = datos?.vacantes.filter((vacante) => vacante.estado_vacante === "Cerrada").length ?? 0;
  const cupos = datos?.vacantes.reduce((suma, vacante) => suma + vacante.cupo_disponible, 0) ?? 0;
  const puedeCapturar = datos?.empresa.puede_capturar_vacantes ?? datos?.empresa.puede_publicar ?? false;

  if (cargando) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-500">
        Cargando ofertas...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Ofertas y Vacantes</h1>
        <p className="text-gray-500 text-sm mt-1">
          Captura planes y vacantes cuando tu convenio este aprobado y vigente.
        </p>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      )}

      <div className="bg-gradient-to-r from-purple-600 to-purple-500 rounded-2xl p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="font-bold text-xl">{datos?.empresa.nombre_empresa ?? "Unidad receptora"}</div>
          <div className="text-purple-100 text-sm mt-1">
            Estado del proceso: {datos?.empresa.convenio_vigente ? "Convenio vigente" : "Convenio pendiente"}
          </div>
        </div>

        <button
          disabled={!puedeCapturar}
          onClick={() => setMostrarFormulario((actual) => !actual)}
          className="bg-white/20 px-4 py-2 rounded-xl text-white font-bold text-sm flex items-center gap-2 hover:bg-white/30 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva vacante
        </button>
      </div>

      {puedeCapturar ? (
        <div className="bg-green-50 border border-green-200 rounded-2xl p-5 flex items-start gap-3">
          <CheckCircle className="w-5 h-5 text-green-700 mt-0.5" />
          <div>
            <div className="font-semibold text-green-800 text-sm">Convenio vigente</div>
            <div className="text-green-700 text-sm mt-1">
              Ya puedes capturar vacantes; quedaran pendientes de revision por Coordinacion.
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-5 flex items-start gap-3">
          <Lock className="w-5 h-5 text-yellow-700 mt-0.5" />
          <div>
            <div className="font-semibold text-yellow-800 text-sm">Plan de trabajo bloqueado</div>
            <div className="text-yellow-700 text-sm mt-1">
              {datos?.empresa.motivo_bloqueo ??
                "Necesitas documentacion legal aprobada y convenio vigente antes de capturar vacantes."}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {([
          ["Vacantes", total, Briefcase, "bg-purple-50 text-purple-600"],
          ["Visibles en padron", visibles, CheckCircle, "bg-green-50 text-green-600"],
          ["Cupos disponibles", cupos, Users, "bg-blue-50 text-blue-600"],
          ["Cerradas", cerradas, XCircle, "bg-red-50 text-red-600"],
        ] satisfies ColoredStatCard[]).map(([label, value, Icon, color]) => (
          <div key={label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <div className={`w-10 h-10 ${color} rounded-xl flex items-center justify-center mb-3`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-[#0d2b5e]">{value}</div>
            <div className="text-gray-500 text-sm mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      {mostrarFormulario && puedeCapturar && (
        <form onSubmit={crearVacante} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-4">Nueva vacante</h3>
          <div className="grid md:grid-cols-2 gap-4">
            <input
              value={form.titulo}
              onChange={(event) => setForm({ ...form, titulo: event.target.value })}
              required
              placeholder="Titulo del proyecto"
              className="border rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1565c0]"
            />

            <select
              value={form.id_carrera}
              onChange={(event) => setForm({ ...form, id_carrera: Number(event.target.value) })}
              required
              className="border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-[#1565c0]"
            >
              {carreras.map((carrera) => (
                <option key={carrera.id_carrera} value={carrera.id_carrera}>
                  {carrera.nombre}
                </option>
              ))}
            </select>

            <select
              value={form.modalidad}
              onChange={(event) =>
                setForm({
                  ...form,
                  modalidad: event.target.value as CrearVacanteUnidadInput["modalidad"],
                })
              }
              className="border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-[#1565c0]"
            >
              <option value="Presencial">Presencial</option>
              <option value="Virtual">Virtual</option>
              <option value="Hibrida">Hibrida</option>
            </select>

            <select
              value={form.periodo}
              onChange={(event) =>
                setForm({
                  ...form,
                  periodo: event.target.value as VacanteForm["periodo"],
                })
              }
              required
              className="border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-[#1565c0]"
            >
              <option value="Semestral">Semestral</option>
              <option value="Cuatrimestral">Cuatrimestral</option>
            </select>

            <select
              value={form.id_tipo_practica}
              onChange={(event) => setForm({ ...form, id_tipo_practica: Number(event.target.value) })}
              required
              className="border rounded-xl px-3 py-2 text-sm bg-white outline-none focus:border-[#1565c0]"
            >
              {tiposPractica.map((tipo) => (
                <option key={tipo.id_tipo_practica} value={tipo.id_tipo_practica}>
                  {tipo.nombre} ({tipo.horas_requeridas} h)
                </option>
              ))}
            </select>

            <input
              value={form.horario}
              onChange={(event) => setForm({ ...form, horario: event.target.value })}
              placeholder="Horario"
              className="border rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1565c0]"
            />

            <input
              type="number"
              min={1}
              value={form.cupo_total}
              onChange={(event) => setForm({ ...form, cupo_total: Number(event.target.value) })}
              required
              placeholder="Cupo total"
              className="border rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1565c0]"
            />

            <textarea
              value={form.descripcion}
              onChange={(event) => setForm({ ...form, descripcion: event.target.value })}
              placeholder="Descripcion de actividades"
              rows={3}
              className="md:col-span-2 border rounded-xl px-3 py-2 text-sm outline-none resize-none focus:border-[#1565c0]"
            />
          </div>

          <div className="flex justify-end gap-3 mt-5">
            <button
              type="button"
              onClick={() => setMostrarFormulario(false)}
              className="border border-gray-200 text-gray-600 rounded-xl px-4 py-2 text-sm font-semibold"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando || !form.titulo.trim() || !form.id_carrera || !form.id_tipo_practica || !form.periodo}
              className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold disabled:opacity-50"
            >
              {guardando ? "Guardando..." : "Crear vacante"}
            </button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="border rounded-xl px-3 py-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-gray-400" />
          <input
            value={busqueda}
            onChange={(event) => setBusqueda(event.target.value)}
            className="outline-none text-sm w-full"
            placeholder="Buscar por proyecto, carrera o modalidad..."
          />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">Vacantes Registradas</h3>
        </div>

        <div className="divide-y divide-gray-100">
          {vacantesFiltradas.map((vacante: VacanteUnidad) => (
            <div key={vacante.id_vacante} className="px-6 py-5 hover:bg-gray-50">
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h4 className="font-bold text-gray-800 text-sm">{vacante.titulo}</h4>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-semibold ${
                        vacante.visible_padron
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {vacante.visible_padron ? "Visible en padron" : "No visible"}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600">{vacante.carrera}</div>
                  <div className="text-xs text-gray-400 mt-0.5">
                    {vacante.modalidad} · {vacante.periodo ?? "Sin periodo"} · {vacante.tipo_practica ?? "Sin tipo"} · {vacante.horario ?? "Horario no registrado"}
                  </div>

                  <p className="text-sm text-gray-600 mt-3">
                    {vacante.descripcion ?? "Sin descripcion registrada."}
                  </p>

                  <div className="grid sm:grid-cols-3 gap-3 mt-4">
                    <div className="border rounded-xl p-3">
                      <div className="text-xs text-gray-500">Cupo total</div>
                      <div className="font-bold text-[#0d2b5e]">{vacante.cupo_total}</div>
                    </div>
                    <div className="border rounded-xl p-3">
                      <div className="text-xs text-gray-500">Disponible</div>
                      <div className="font-bold text-[#0d2b5e]">{vacante.cupo_disponible}</div>
                    </div>
                    <div className="border rounded-xl p-3">
                      <div className="text-xs text-gray-500">Estado</div>
                      <div className="font-bold text-[#0d2b5e]">{vacante.estado_vacante}</div>
                    </div>
                  </div>
                </div>

                <button className="flex items-center justify-center gap-2 px-4 py-2 bg-[#0d2b5e] text-white rounded-lg text-xs font-semibold">
                  <Eye className="w-3.5 h-3.5" />
                  Detalle
                </button>
              </div>
            </div>
          ))}

          {vacantesFiltradas.length === 0 && (
            <div className="px-6 py-10 text-center">
              <AlertTriangle className="w-8 h-8 text-gray-300 mx-auto mb-2" />
              <div className="text-sm text-gray-500">No hay vacantes registradas.</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
