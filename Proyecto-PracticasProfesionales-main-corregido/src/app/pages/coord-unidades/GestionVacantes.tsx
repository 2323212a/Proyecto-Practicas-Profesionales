import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import axios from "axios";
import {
  AlertTriangle,
  Briefcase,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock,
  Download,
  Filter,
  FileText,
  RotateCcw,
  Search,
  Users,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router";

import { gestionVacantesRevisionUseCase } from "../../dependencies";
import { apiClient } from "../../../infrastructure/api/apiClient";
import type { VacanteRevision } from "../../../domain/coord-unidades/VacanteRevision";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

import type { StatCard } from "../../../shared/types/ui";
const estadoColor: Record<string, string> = {
  Pendiente: "bg-orange-100 text-orange-700",
  "Con observaciones": "bg-yellow-100 text-yellow-700",
  PrePadron: "bg-blue-100 text-blue-700",
  Activa: "bg-green-100 text-green-700",
  Rechazada: "bg-red-100 text-red-700",
  Cerrada: "bg-gray-100 text-gray-600",
};

type FormatoPlanTrabajo = {
  id_formato_plan: number;
  id_convocatoria?: number | null;
  convocatoria?: string | null;
  nombre: string;
  descripcion?: string | null;
  nombre_archivo: string;
  activo: boolean;
  fecha_subida?: string | null;
};

function obtenerMensajeFormatoPlanError(error: unknown, mensajeDefault: string) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;

    if (typeof detail === "string") return detail;

    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          const loc = Array.isArray(item?.loc) ? item.loc[item.loc.length - 1] : undefined;
          if (loc === "nombre") return "El nombre del formato es obligatorio.";
          if (loc === "archivo") return "Debes seleccionar un archivo.";
          if (loc === "id_convocatoria") return "La convocatoria seleccionada no es valida.";
          if (typeof item?.msg === "string") return item.msg;
          return JSON.stringify(item);
        })
        .join("\n");
    }

    if (detail) return JSON.stringify(detail);
  }

  return mensajeDefault;
}

function descargarArchivoBlob(blob: Blob, nombreArchivo: string) {
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement("a");
  enlace.href = url;
  enlace.download = nombreArchivo || "plan_trabajo.pdf";
  document.body.appendChild(enlace);
  enlace.click();
  enlace.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

async function obtenerMensajeDescarga(error: unknown, mensajeDefault: string) {
  if (axios.isAxiosError(error) && error.response?.data instanceof Blob) {
    try {
      const contenido = JSON.parse(await error.response.data.text()) as { detail?: unknown };
      if (typeof contenido.detail === "string") return contenido.detail;
    } catch {
      return mensajeDefault;
    }
  }
  return getApiErrorMessage(error, mensajeDefault);
}

export function GestionVacantes() {
  const navigate = useNavigate();
  const [vacantes, setVacantes] = useState<VacanteRevision[]>([]);
  const [busqueda, setBusqueda] = useState("");
  const [convocatoria, setConvocatoria] = useState("Todas");
  const [estado, setEstado] = useState("Todos");
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [formatosPlan, setFormatosPlan] = useState<FormatoPlanTrabajo[]>([]);
  const [formatoForm, setFormatoForm] = useState({ nombre: "", descripcion: "", id_convocatoria: "" });
  const [archivoFormato, setArchivoFormato] = useState<File | null>(null);
  const [archivoFormatoKey, setArchivoFormatoKey] = useState(0);

  useEffect(() => {
    cargarVacantes();
  }, []);

  async function cargarVacantes() {
    try {
      setCargando(true);
      setError("");
      const data = await gestionVacantesRevisionUseCase.listar();
      setVacantes(data);
      const formatos = await apiClient.get<FormatoPlanTrabajo[]>("/coord-unidades/vacantes/formatos-plan-trabajo");
      setFormatosPlan(formatos.data);
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las vacantes.");
    } finally {
      setCargando(false);
    }
  }

  const filtradas = useMemo(() => {
    const q = busqueda.trim().toLowerCase();
    return vacantes.filter((vacante) => {
      const coincideBusqueda =
        vacante.empresa.toLowerCase().includes(q) ||
        vacante.titulo.toLowerCase().includes(q) ||
        (vacante.convocatoria ?? "").toLowerCase().includes(q) ||
        (vacante.tipo_practica ?? "").toLowerCase().includes(q);
      const coincideConvocatoria = convocatoria === "Todas" || String(vacante.id_convocatoria) === convocatoria;
      const coincideEstado = estado === "Todos" || vacante.estado_vacante === estado;
      return coincideBusqueda && coincideConvocatoria && coincideEstado;
    });
  }, [vacantes, busqueda, convocatoria, estado]);

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

  const resumen = {
    total: vacantes.length,
    pendientes: vacantes.filter((vacante) => vacante.estado_vacante === "Pendiente").length,
    prepadron: vacantes.filter((vacante) => vacante.estado_vacante === "PrePadron").length,
    activas: vacantes.filter((vacante) => vacante.estado_vacante === "Activa").length,
    cerradas: vacantes.filter((vacante) => vacante.estado_vacante === "Cerrada").length,
    publicables: vacantes.filter((vacante) => vacante.publicable).length,
    ocupados: vacantes.reduce((total, vacante) => total + vacante.cupo_ocupado, 0),
  };

  function limpiarFiltros() {
    setBusqueda("");
    setConvocatoria("Todas");
    setEstado("Todos");
  }

  async function cambiarEstado(vacante: VacanteRevision, nuevoEstado: string) {
    const requiereObservacion = ["Con observaciones", "Rechazada"].includes(nuevoEstado);
    const observaciones = requiereObservacion ? window.prompt("Observaciones") : undefined;
    if (requiereObservacion && !observaciones?.trim()) {
      return;
    }
    try {
      setGuardando(vacante.id_vacante);
      await gestionVacantesRevisionUseCase.cambiarEstado(vacante.id_vacante, nuevoEstado, observaciones?.trim());
      await cargarVacantes();
    } catch (err: unknown) {
      console.error(err);
      alert(getApiErrorMessage(err, "No se pudo actualizar la vacante."));
    } finally {
      setGuardando(null);
    }
  }

  async function revisarAmpliacion(solicitud: NonNullable<VacanteRevision["solicitudes_ampliacion"]>[number], accion: "aprobar" | "rechazar") {
    const observaciones = window.prompt("Observaciones") ?? "";
    if (accion === "rechazar" && observaciones.trim().length < 3) {
      alert("Escribe el motivo del rechazo.");
      return;
    }
    const cupos_aprobados: Record<number, number> = {};
    if (accion === "aprobar") {
      for (const detalle of solicitud.detalles ?? []) {
        const respuesta = window.prompt(
          `${detalle.tipo_practica ?? "Tipo"}: cupos aprobados de ${detalle.cupos_solicitados}`,
          String(detalle.cupos_solicitados),
        );
        if (respuesta === null) return;
        const aprobados = Number(respuesta);
        if (aprobados < 0 || aprobados > detalle.cupos_solicitados || Number.isNaN(aprobados)) {
          alert("Los cupos aprobados no pueden ser negativos ni exceder los solicitados.");
          return;
        }
        cupos_aprobados[detalle.id_tipo_practica] = aprobados;
      }
    }
    try {
      setGuardando(solicitud.id_solicitud_ampliacion);
      await apiClient.post(`/coord-unidades/empresas/vacantes/solicitudes-ampliacion/${solicitud.id_solicitud_ampliacion}/${accion}`, {
        observaciones: observaciones.trim() || undefined,
        cupos_aprobados,
      });
      await cargarVacantes();
    } catch (err) {
      console.error(err);
      alert(getApiErrorMessage(err, "No se pudo revisar la solicitud de ampliación."));
    } finally {
      setGuardando(null);
    }
  }

  async function descargarPlanTrabajo(vacante: VacanteRevision) {
    try {
      const { data } = await apiClient.get(`/coord-unidades/empresas/vacantes/${vacante.id_vacante}/plan-trabajo/archivo`, { responseType: "blob" });
      descargarArchivoBlob(data, vacante.plan_trabajo?.nombre_archivo ?? "plan_trabajo.pdf");
    } catch (err) {
      console.error(err);
      alert(await obtenerMensajeDescarga(err, "No fue posible descargar el Plan de Trabajo."));
    }
  }

  async function subirFormatoPlanTrabajo(event: FormEvent) {
    event.preventDefault();
    setError("");
    setMensaje("");
    const nombre = formatoForm.nombre.trim();
    const descripcion = formatoForm.descripcion.trim();
    const idConvocatoria = formatoForm.id_convocatoria.trim();

    if (!nombre) {
      setError("El nombre del formato es obligatorio.");
      return;
    }
    if (!archivoFormato) {
      setError("Debes seleccionar un archivo.");
      return;
    }

    if (idConvocatoria && Number.isNaN(Number(idConvocatoria))) {
      setError("La convocatoria seleccionada no es valida.");
      return;
    }

    try {
      const formData = new FormData();
      formData.append("nombre", nombre);
      if (descripcion) formData.append("descripcion", descripcion);
      if (idConvocatoria) formData.append("id_convocatoria", String(Number(idConvocatoria)));
      formData.append("archivo", archivoFormato);
      await apiClient.post("/coord-unidades/vacantes/formatos-plan-trabajo", formData);
      setFormatoForm({ nombre: "", descripcion: "", id_convocatoria: "" });
      setArchivoFormato(null);
      setArchivoFormatoKey((value) => value + 1);
      setMensaje("Formato de Plan de Trabajo guardado correctamente.");
      await cargarVacantes();
    } catch (err) {
      console.error(err);
      setError(obtenerMensajeFormatoPlanError(err, "No fue posible subir el formato oficial."));
    }
  }

  async function descargarFormatoPlanTrabajo(formato: FormatoPlanTrabajo) {
    try {
      const { data } = await apiClient.get(`/coord-unidades/vacantes/formatos-plan-trabajo/${formato.id_formato_plan}/archivo`, { responseType: "blob" });
      descargarArchivoBlob(data, formato.nombre_archivo);
    } catch (err) {
      console.error(err);
      alert(await obtenerMensajeDescarga(err, "No fue posible descargar el formato."));
    }
  }

  async function cambiarEstadoFormato(formato: FormatoPlanTrabajo) {
    try {
      await apiClient.patch(`/coord-unidades/vacantes/formatos-plan-trabajo/${formato.id_formato_plan}/${formato.activo ? "desactivar" : "activar"}`);
      await cargarVacantes();
    } catch (err) {
      console.error(err);
      setError(getApiErrorMessage(err, "No fue posible cambiar el estado del formato."));
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Revision de Vacantes</h1>
        <p className="text-gray-500 text-sm mt-1">
          Revisa vacantes pendientes y envialas a pre-padron. La liberacion final se realiza en Padron Empresarial.
        </p>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      )}
      {mensaje && (
        <div className="bg-green-50 border border-green-200 rounded-xl px-4 py-3 text-sm text-green-700">
          {mensaje}
        </div>
      )}

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {([
          ["Vacantes", resumen.total, Briefcase],
          ["Pendientes", resumen.pendientes, Clock],
          ["Pre-padron", resumen.prepadron, CheckCircle2],
          ["Publicables", resumen.publicables, Users],
        ] satisfies StatCard[]).map(([label, value, Icon]) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-500">
              <Icon className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0d2b5e]">{cargando ? "..." : value}</div>
              <div className="text-xs text-gray-500">{label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-4 h-4 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e] text-sm">Formato de Plan de Trabajo</h3>
        </div>
        <form onSubmit={subirFormatoPlanTrabajo} className="grid md:grid-cols-[1fr_1fr_180px_220px_auto] gap-3">
          <input
            value={formatoForm.nombre}
            onChange={(event) => setFormatoForm({ ...formatoForm, nombre: event.target.value })}
            placeholder="Nombre del formato"
            className="border rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1565c0]"
          />
          <input
            value={formatoForm.descripcion}
            onChange={(event) => setFormatoForm({ ...formatoForm, descripcion: event.target.value })}
            placeholder="Descripción"
            className="border rounded-xl px-3 py-2 text-sm outline-none focus:border-[#1565c0]"
          />
          <select
            value={formatoForm.id_convocatoria}
            onChange={(event) => setFormatoForm({ ...formatoForm, id_convocatoria: event.target.value })}
            className="border rounded-xl px-3 py-2 text-sm bg-white"
          >
            <option value="">Formato general</option>
            {convocatorias.map(([id, nombre]) => (
              <option key={id} value={String(id)}>
                Convocatoria #{id} - {nombre}
              </option>
            ))}
          </select>
          <input
            key={archivoFormatoKey}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={(event) => setArchivoFormato(event.target.files?.[0] ?? null)}
            className="text-sm"
          />
          <button type="submit" className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-xs font-semibold">
            Subir
          </button>
        </form>
        {formatosPlan.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4">
            {formatosPlan.map((formato) => (
              <div key={formato.id_formato_plan} className="border rounded-xl px-3 py-2 text-xs flex items-center gap-2">
                <span className="font-semibold text-[#0d2b5e]">{formato.nombre}</span>
                <span className={formato.activo ? "text-green-700" : "text-gray-500"}>{formato.activo ? "Activo" : "Inactivo"}</span>
                <span className="text-gray-500">{formato.convocatoria ?? "General"}</span>
                <button type="button" onClick={() => descargarFormatoPlanTrabajo(formato)} className="text-[#1565c0] font-semibold">Descargar</button>
                <button type="button" onClick={() => cambiarEstadoFormato(formato)} className="text-gray-600 font-semibold">
                  {formato.activo ? "Desactivar" : "Activar"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#1565c0]" />
            <h3 className="font-bold text-[#0d2b5e] text-sm">Filtros</h3>
          </div>
          <button onClick={limpiarFiltros} className="flex items-center gap-1 text-xs text-gray-500 hover:text-[#1565c0]">
            <RotateCcw className="w-3.5 h-3.5" />
            Limpiar filtros
          </button>
        </div>

        <div className="grid md:grid-cols-[1fr_180px_180px] gap-4">
          <label className="border rounded-xl px-3 py-2 flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              value={busqueda}
              onChange={(event) => setBusqueda(event.target.value)}
              className="outline-none text-sm w-full"
              placeholder="Buscar empresa, vacante, convocatoria o tipo..."
            />
          </label>

          <select value={convocatoria} onChange={(event) => setConvocatoria(event.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white">
            <option value="Todas">Todas las convocatorias</option>
            {convocatorias.map(([id, nombre]) => (
              <option key={id} value={String(id)}>
                {nombre}
              </option>
            ))}
          </select>

          <select value={estado} onChange={(event) => setEstado(event.target.value)} className="border rounded-xl px-3 py-2 text-sm bg-white">
            <option>Todos</option>
            <option>Pendiente</option>
            <option>Con observaciones</option>
            <option>PrePadron</option>
            <option>Activa</option>
            <option>Rechazada</option>
            <option>Cerrada</option>
          </select>
        </div>
      </div>

      {cargando ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-sm text-gray-500">
          Cargando vacantes...
        </div>
      ) : filtradas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-10 text-center text-gray-400">
          No hay vacantes que coincidan con los filtros seleccionados.
        </div>
      ) : (
        <div className="grid xl:grid-cols-3 gap-5">
          {filtradas.map((vacante) => (
            <div key={vacante.id_vacante} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-bold text-[#0d2b5e]">{vacante.empresa}</h3>
                  <p className="text-sm text-gray-500 mt-1">{vacante.titulo}</p>
                  <p className="text-xs text-gray-400 mt-1">{vacante.convocatoria ?? "Sin convocatoria"}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${estadoColor[vacante.estado_vacante] ?? "bg-gray-100 text-gray-600"}`}>
                  {vacante.estado_vacante}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mt-5">
                <div className="border rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-4 h-4" />
                    Cupo
                  </div>
                  <p className="font-bold text-[#0d2b5e] mt-1">
                    {(vacante.tipos_practica ?? []).reduce((total, tipo) => total + tipo.cupos, 0)}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {vacante.cupo_ocupado} ocupado(s) por alumnos
                  </p>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <CalendarDays className="w-4 h-4" />
                    Convocatoria
                  </div>
                  <p className="font-bold text-[#0d2b5e] mt-1">{vacante.convocatoria ?? "Sin convocatoria"}</p>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-xs text-gray-500">Periodo</div>
                  <p className="font-bold text-[#0d2b5e] mt-1">{vacante.periodo ?? "Sin periodo"}</p>
                </div>
                <div className="border rounded-xl p-3">
                  <div className="text-xs text-gray-500">Tipos de práctica</div>
                  <p className="font-bold text-[#0d2b5e] mt-1">
                    {(vacante.tipos_practica?.map((tipo) => tipo.nombre).filter(Boolean).join(", ")) || vacante.tipo_practica || "Sin tipo"}
                  </p>
                </div>
              </div>

              <div className="mt-4 border rounded-xl p-4">
                <div className="text-xs font-semibold text-gray-500">Cupos por tipo</div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {(vacante.tipos_practica ?? []).map((tipo) => (
                    <span key={tipo.id_tipo_practica} className="bg-blue-50 text-blue-700 rounded-full px-3 py-1 text-xs">
                      {tipo.nombre ?? "Tipo"}: {tipo.cupos_disponibles}/{tipo.cupos}
                    </span>
                  ))}
                </div>
                <div className="text-xs font-semibold text-gray-500 mt-3">Carreras destino</div>
                <p className="text-sm text-gray-600 mt-1">
                  {vacante.aplica_todas_carreras
                    ? "Todas las carreras"
                    : (vacante.carreras?.map((carrera) => carrera.nombre).join(", ") || "Carreras específicas")}
                </p>
              </div>

              <div className={`mt-4 border rounded-xl p-4 ${vacante.plan_trabajo ? "border-green-100 bg-green-50" : "border-red-100 bg-red-50"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2">
                    <FileText className={`w-4 h-4 mt-0.5 ${vacante.plan_trabajo ? "text-green-700" : "text-red-700"}`} />
                    <div>
                      <div className={`text-xs font-bold ${vacante.plan_trabajo ? "text-green-800" : "text-red-700"}`}>Plan de Trabajo</div>
                      <p className="text-xs text-gray-600 mt-1">
                        {vacante.plan_trabajo
                          ? `${vacante.plan_trabajo.nombre_archivo} · ${vacante.plan_trabajo.estado_documento}`
                          : "Sin Plan de Trabajo"}
                      </p>
                    </div>
                  </div>
                  {vacante.plan_trabajo && (
                    <button
                      type="button"
                      onClick={() => descargarPlanTrabajo(vacante)}
                      className="flex items-center gap-1 border border-green-200 bg-white text-green-700 rounded-lg px-3 py-1.5 text-xs font-semibold"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Descargar Plan de Trabajo
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 border rounded-xl p-4">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Building2 className="w-4 h-4" />
                  Empresa
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${vacante.estado_empresa === "Activa" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {vacante.estado_empresa}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${vacante.publicable ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"}`}>
                    {vacante.publicable ? "Visible en padron" : "No publicable"}
                  </span>
                </div>
              </div>

              {vacante.descripcion && (
                <div className="mt-4 bg-gray-50 rounded-xl p-4 text-sm text-gray-600">
                  {vacante.descripcion}
                </div>
              )}

              {(vacante.actividades || vacante.requisitos) && (
                <div className="grid md:grid-cols-2 gap-3 mt-4">
                  {vacante.actividades && (
                    <div className="border rounded-xl p-4 text-sm text-gray-600">
                      <div className="text-xs font-semibold text-gray-500 mb-1">Actividades</div>
                      {vacante.actividades}
                    </div>
                  )}
                  {vacante.requisitos && (
                    <div className="border rounded-xl p-4 text-sm text-gray-600">
                      <div className="text-xs font-semibold text-gray-500 mb-1">Requisitos</div>
                      {vacante.requisitos}
                    </div>
                  )}
                </div>
              )}

              {vacante.observaciones && (
                <div className="mt-4 bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm text-yellow-700">
                  {vacante.observaciones}
                </div>
              )}

              {vacante.solicitudes_ampliacion?.some((solicitud) => solicitud.estado === "Pendiente") && (
                <div className="mt-4 border border-blue-100 bg-blue-50 rounded-xl p-4">
                  <div className="text-xs font-bold text-[#0d2b5e]">Solicitudes de ampliación de cupos</div>
                  <div className="space-y-3 mt-3">
                    {vacante.solicitudes_ampliacion
                      .filter((solicitud) => solicitud.estado === "Pendiente")
                      .map((solicitud) => (
                        <div key={solicitud.id_solicitud_ampliacion} className="bg-white border border-blue-100 rounded-lg p-3">
                          <div className="text-sm font-semibold text-[#0d2b5e]">{solicitud.cupos_solicitados} cupos solicitados</div>
                          <p className="text-xs text-gray-600 mt-1">{solicitud.motivo}</p>
                          <div className="space-y-1 mt-2">
                            {(solicitud.detalles?.length
                              ? solicitud.detalles
                              : [{ id_tipo_practica: solicitud.id_tipo_practica ?? 0, tipo_practica: solicitud.tipo_practica, cupos_solicitados: solicitud.cupos_solicitados, estado: solicitud.estado }]
                            ).map((detalle) => (
                              <div key={detalle.id_tipo_practica} className="text-xs bg-blue-50 border border-blue-100 rounded-lg px-2 py-1">
                                {detalle.tipo_practica ?? "Tipo"}: {detalle.cupos_solicitados} cupos solicitados
                              </div>
                            ))}
                          </div>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => revisarAmpliacion(solicitud, "aprobar")}
                              disabled={guardando === solicitud.id_solicitud_ampliacion}
                              className="bg-green-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                            >
                              Aprobar
                            </button>
                            <button
                              onClick={() => revisarAmpliacion(solicitud, "rechazar")}
                              disabled={guardando === solicitud.id_solicitud_ampliacion}
                              className="border border-red-200 text-red-600 rounded-lg px-3 py-1.5 text-xs font-semibold disabled:opacity-50"
                            >
                              Rechazar
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-2 mt-5">
                {vacante.estado_vacante === "Pendiente" && (
                  <>
                    <button
                      onClick={() => cambiarEstado(vacante, "PrePadron")}
                      disabled={guardando === vacante.id_vacante || !vacante.plan_trabajo}
                      title={vacante.plan_trabajo ? "Aprobar a pre-padron" : "La vacante no tiene Plan de Trabajo cargado."}
                      className="bg-green-600 text-white rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Aprobar a pre-padron
                    </button>
                    <button
                      onClick={() => cambiarEstado(vacante, "Con observaciones")}
                      disabled={guardando === vacante.id_vacante}
                      className="border border-yellow-200 text-yellow-700 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      Observaciones
                    </button>
                    <button
                      onClick={() => cambiarEstado(vacante, "Rechazada")}
                      disabled={guardando === vacante.id_vacante}
                      className="border border-red-200 text-red-600 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
                    >
                      Rechazar
                    </button>
                  </>
                )}
                {vacante.estado_vacante === "PrePadron" && (
                  <button
                    onClick={() => cambiarEstado(vacante, "Con observaciones")}
                    disabled={guardando === vacante.id_vacante}
                    className="border border-yellow-200 text-yellow-700 rounded-xl px-3 py-2 text-xs font-semibold disabled:opacity-50"
                  >
                    Regresar a observaciones
                  </button>
                )}
                {vacante.estado_vacante === "Activa" && (
                  <button
                    onClick={() => cambiarEstado(vacante, "Cerrada")}
                    disabled={guardando === vacante.id_vacante}
                    className="border border-red-200 text-red-600 rounded-xl px-3 py-2 text-xs font-semibold flex items-center gap-1 disabled:opacity-50"
                  >
                    <XCircle className="w-3 h-3" />
                    Cerrar vacante
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-[#1565c0] mt-0.5" />
        <p className="text-sm text-[#0d2b5e]">
          Las vacantes aprobadas pasan a pre-padron. No seran visibles para alumnos hasta que Coordinacion libere el padron.
          Los cupos ocupados corresponden a asignaciones activas de alumnos.
        </p>
        <button onClick={() => navigate("/coord-unidades/padron")} className="ml-auto bg-[#1565c0] text-white rounded-xl px-4 py-2 text-xs font-semibold">
          Ir a Padron Empresarial
        </button>
      </div>
    </div>
  );
}
