import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  GraduationCap,
  Save,
  Settings,
  Upload,
  Users,
} from "lucide-react";

import { gestionConfiguracionUseCase } from "../../dependencies";
import { obtenerEstadisticasAdmin } from "../../../infrastructure/admin/adminEstadisticasApi";
import { obtenerConvocatorias } from "../../../infrastructure/catalogos/catalogosApi";
import type { ConfiguracionSistema } from "../../../domain/configuracion/ConfiguracionSistema";
import type { ColoredStatCard } from "../../../shared/types/ui";
import { getApiErrorMessage } from "../../../shared/utils/apiError";

type EstadisticasAdmin = {
  usuarios: number;
  usuarios_activos: number;
  alumnos: number;
  roles: number;
  catalogos_total: number;
  convocatorias: number;
};

type ConvocatoriaCatalogo = {
  id_convocatoria: number;
  nombre: string;
  tipo_periodo: string;
  fecha_inicio_general: string | null;
  fecha_cierre_general: string | null;
  fecha_inicio_empresas: string | null;
  fecha_cierre_empresas: string | null;
  estado: string;
};

const CONFIG_INICIAL: ConfiguracionSistema = {
  nombre_sistema: "Sistema Integral de Practicas Profesionales",
  escuela_facultad: "ETDA C-I",
  correo_institucional: "practicas@unach.mx",
  estado_sistema: "Activo",
  inscripcion_empresas_estado: "Abierta",
  ciclo_escolar: "Ciclo escolar vigente",
  hero_titulo: "Sistema Integral de Practicas Profesionales",
  hero_subtitulo:
    "Plataforma institucional para la gestion, seguimiento y control de las practicas profesionales.",
  id_convocatoria_principal: null,
  convocatoria_nombre: "Sin convocatoria principal",
  convocatoria_inicio: null,
  convocatoria_cierre: null,
  convocatoria_empresas_inicio: null,
  convocatoria_empresas_cierre: null,
  convocatoria_periodo: null,
  convocatoria_estado: "Pendiente",
  soporte_telefono: "(961) 619-1200",
};

function formatearFecha(fecha?: string | null) {
  if (!fecha) return "Sin fecha";
  const date = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function calcularEstadoInscripcionEmpresas(
  convocatoria: {
    estado?: string | null;
    fecha_inicio_empresas?: string | null;
    fecha_cierre_empresas?: string | null;
  } | null,
) {
  if (!convocatoria || convocatoria.estado !== "Activa") return "Cerrada";
  if (!convocatoria.fecha_inicio_empresas || !convocatoria.fecha_cierre_empresas) return "Cerrada";

  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  const inicio = new Date(`${convocatoria.fecha_inicio_empresas}T00:00:00`);
  const cierre = new Date(`${convocatoria.fecha_cierre_empresas}T00:00:00`);

  if (Number.isNaN(inicio.getTime()) || Number.isNaN(cierre.getTime())) return "Cerrada";
  return inicio <= hoy && hoy <= cierre ? "Abierta" : "Cerrada";
}

export function AdminConfiguracion() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionSistema>(CONFIG_INICIAL);
  const [estadisticas, setEstadisticas] = useState<EstadisticasAdmin | null>(null);
  const [convocatorias, setConvocatorias] = useState<ConvocatoriaCatalogo[]>([]);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [estadoSistemaOriginal, setEstadoSistemaOriginal] = useState(CONFIG_INICIAL.estado_sistema);
  const [mostrarConfirmacionEstado, setMostrarConfirmacionEstado] = useState(false);

  useEffect(() => {
    void cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      setCargando(true);
      setMensaje("");
      const [configData, estadisticasData, convocatoriasData] = await Promise.all([
        gestionConfiguracionUseCase.obtener(),
        obtenerEstadisticasAdmin(),
        obtenerConvocatorias(),
      ]);
      setConfiguracion(configData);
      setEstadoSistemaOriginal(configData.estado_sistema);
      setEstadisticas(estadisticasData);
      setConvocatorias(convocatoriasData);
    } catch (error) {
      console.error(error);
      setMensaje("No se pudieron cargar todos los datos de configuracion. Se muestran valores seguros por defecto.");
    } finally {
      setCargando(false);
    }
  }

  function actualizarCampo<K extends keyof ConfiguracionSistema>(
    campo: K,
    valor: ConfiguracionSistema[K],
  ) {
    setConfiguracion((actual) => ({
      ...actual,
      [campo]: valor,
    }));
  }

  function seleccionarConvocatoria(idSeleccionado: string) {
    const id = Number(idSeleccionado);
    const convocatoria = convocatorias.find((item) => item.id_convocatoria === id);

    setConfiguracion((actual) => ({
      ...actual,
      id_convocatoria_principal: Number.isFinite(id) ? id : null,
      convocatoria_nombre: convocatoria?.nombre ?? actual.convocatoria_nombre,
      convocatoria_inicio: convocatoria?.fecha_inicio_general ?? actual.convocatoria_inicio,
      convocatoria_cierre: convocatoria?.fecha_cierre_general ?? actual.convocatoria_cierre,
      convocatoria_empresas_inicio: convocatoria?.fecha_inicio_empresas ?? actual.convocatoria_empresas_inicio,
      convocatoria_empresas_cierre: convocatoria?.fecha_cierre_empresas ?? actual.convocatoria_empresas_cierre,
      convocatoria_periodo: convocatoria?.tipo_periodo ?? actual.convocatoria_periodo,
      convocatoria_estado: convocatoria?.estado ?? actual.convocatoria_estado,
      inscripcion_empresas_estado: calcularEstadoInscripcionEmpresas(convocatoria ?? null),
      inscripcion_empresas_motivo: null,
    }));
  }

  async function guardarConfirmado() {
    try {
      setGuardando(true);
      setMensaje("");
      const guardada = await gestionConfiguracionUseCase.guardar(configuracion);
      setConfiguracion(guardada);
      setEstadoSistemaOriginal(guardada.estado_sistema);
      setMostrarConfirmacionEstado(false);
      setMensaje("Configuracion guardada correctamente.");
    } catch (error) {
      console.error(error);
      setMensaje(getApiErrorMessage(error, "No se pudo guardar la configuracion."));
    } finally {
      setGuardando(false);
    }
  }

  function guardarCambios() {
    if (estadoSistemaOriginal !== configuracion.estado_sistema) {
      setMostrarConfirmacionEstado(true);
      return;
    }

    void guardarConfirmado();
  }

  function confirmarCambioEstado() {
    setMostrarConfirmacionEstado(false);
    void guardarConfirmado();
  }

  const convocatoriaSeleccionada = useMemo(
    () =>
      convocatorias.find(
        (item) => item.id_convocatoria === configuracion.id_convocatoria_principal,
      ),
    [convocatorias, configuracion.id_convocatoria_principal],
  );

  const tarjetas: ColoredStatCard[] = [
    ["Convocatoria publicada", configuracion.convocatoria_nombre, CalendarDays, "bg-blue-600"],
    ["Alumnos registrados", String(estadisticas?.alumnos ?? 0), GraduationCap, "bg-green-600"],
    ["Usuarios activos", String(estadisticas?.usuarios_activos ?? 0), Users, "bg-purple-600"],
    ["Ultima actualizacion", formatearFecha(configuracion.ultima_actualizacion), Upload, "bg-orange-500"],
  ];

  const estadoAdministrativo = [
    [`${estadisticas?.roles ?? 0} roles institucionales configurados`, Boolean(estadisticas?.roles)],
    [`${estadisticas?.catalogos_total ?? 0} catalogos base registrados`, Boolean(estadisticas?.catalogos_total)],
    [`${estadisticas?.convocatorias ?? 0} convocatorias registradas`, Boolean(estadisticas?.convocatorias)],
    [`${estadisticas?.alumnos ?? 0} alumnos registrados`, Boolean(estadisticas?.alumnos)],
  ] as const;

  const estadoVisual = {
    Activo: {
      texto: "Sistema activo. Los usuarios pueden operar normalmente.",
      clase: "bg-green-50 border-green-200 text-green-700",
    },
    Mantenimiento: {
      texto: "Modo mantenimiento activo. Solo Administradores pueden iniciar sesion.",
      clase: "bg-yellow-50 border-yellow-200 text-yellow-800",
    },
    Suspendido: {
      texto: "Sistema suspendido. Solo Administradores pueden iniciar sesion.",
      clase: "bg-red-50 border-red-200 text-red-700",
    },
  }[configuracion.estado_sistema] ?? {
    texto: "Estado del sistema sin descripcion configurada.",
    clase: "bg-gray-50 border-gray-200 text-gray-600",
  };

  const confirmacionEstado = {
    Activo: {
      titulo: "Reactivar sistema",
      mensaje:
        "Al cambiar el sistema a Activo, los usuarios podran iniciar sesion nuevamente y el registro publico de empresas volvera a estar disponible.",
      extra: "",
      confirmar: "Reactivar sistema",
      clase: "bg-green-50 border-green-200 text-green-700",
    },
    Mantenimiento: {
      titulo: "Activar modo mantenimiento",
      mensaje:
        "Al activar el modo mantenimiento, los usuarios que no sean Administrador no podran iniciar sesion. Tambien se deshabilitar? el registro publico de empresas.",
      extra: "Los Administradores podran seguir entrando para volver a activar el sistema.",
      confirmar: "Confirmar cambio",
      clase: "bg-yellow-50 border-yellow-200 text-yellow-800",
    },
    Suspendido: {
      titulo: "Suspender sistema",
      mensaje:
        "Al suspender el sistema, alumnos, empresas, coordinadores, asesores y direccion no podran iniciar sesion. El registro publico de empresas tambien quedara deshabilitado.",
      extra: "Solo los Administradores podran ingresar para reactivar el sistema.",
      confirmar: "Confirmar suspension",
      clase: "bg-red-50 border-red-200 text-red-700",
    },
  }[configuracion.estado_sistema] ?? {
    titulo: "Confirmar cambio",
    mensaje: "El estado del sistema cambio. Confirma antes de guardar.",
    extra: "",
    confirmar: "Confirmar cambio",
    clase: "bg-gray-50 border-gray-200 text-gray-700",
  };

  const inscripcionVisual = {
    Abierta: {
      texto: configuracion.inscripcion_empresas_motivo ?? "La convocatoria esta dentro del periodo de registro de empresas.",
      clase: "bg-green-50 border-green-200 text-green-700",
    },
    Cerrada: {
      texto: configuracion.inscripcion_empresas_motivo ?? "Fuera del periodo de registro de empresas de la convocatoria.",
      clase: "bg-yellow-50 border-yellow-200 text-yellow-800",
    },
  }[configuracion.inscripcion_empresas_estado] ?? {
    texto: "Estado de inscripcion sin descripcion configurada.",
    clase: "bg-gray-50 border-gray-200 text-gray-600",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Configuracion</h1>
        <p className="text-gray-500 text-sm mt-1">
          Parametros institucionales y contenido visible en la pagina principal.
        </p>
      </div>

      {cargando && (
        <div className="bg-gray-50 border border-gray-200 text-gray-600 rounded-xl p-4 text-sm">
          Cargando configuracion actual...
        </div>
      )}

      {mensaje && (
        <div className="bg-blue-50 border border-blue-200 text-[#0d2b5e] rounded-xl p-4 text-sm">
          {mensaje}
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        {tarjetas.map(([titulo, valor, Icon, color]) => (
          <div key={titulo} className={`${color} rounded-2xl p-5 text-white`}>
            <Icon className="w-7 h-7 mb-3 opacity-80" />
            <div className="text-2xl font-bold">{valor}</div>
            <div className="text-white/80 text-sm">{titulo}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-5 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#1565c0]" />
          Configuracion institucional
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Nombre del sistema</span>
            <input
              className="mt-2 w-full border rounded-xl px-3 py-2 text-sm"
              value={configuracion.nombre_sistema}
              onChange={(e) => actualizarCampo("nombre_sistema", e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Escuela / Facultad</span>
            <input
              className="mt-2 w-full border rounded-xl px-3 py-2 text-sm"
              value={configuracion.escuela_facultad}
              onChange={(e) => actualizarCampo("escuela_facultad", e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Correo institucional</span>
            <input
              className="mt-2 w-full border rounded-xl px-3 py-2 text-sm"
              value={configuracion.correo_institucional}
              onChange={(e) => actualizarCampo("correo_institucional", e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Estado del sistema</span>
            <select
              className="mt-2 w-full border rounded-xl px-3 py-2 text-sm bg-white"
              value={configuracion.estado_sistema}
              onChange={(e) => actualizarCampo("estado_sistema", e.target.value)}
            >
              <option>Activo</option>
              <option>Mantenimiento</option>
              <option>Suspendido</option>
            </select>
            <div className={`mt-2 rounded-xl border px-3 py-2 text-xs ${estadoVisual.clase}`}>
              {estadoVisual.texto}
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Inscripcion de nuevas empresas</span>
            <div className="mt-2 w-full border rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-700">
              {configuracion.inscripcion_empresas_estado}
            </div>
            <div className={`mt-2 rounded-xl border px-3 py-2 text-xs ${inscripcionVisual.clase}`}>
              {inscripcionVisual.texto}
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Se calcula con las fechas de Registro de empresas configuradas en la convocatoria.
            </p>
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-5 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#1565c0]" />
          Contenido de la pagina principal
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Ciclo escolar</span>
            <input
              className="mt-2 w-full border rounded-xl px-3 py-2 text-sm"
              value={configuracion.ciclo_escolar}
              onChange={(e) => actualizarCampo("ciclo_escolar", e.target.value)}
            />
          </label>

          <label className="block">
            <span className="text-sm font-semibold text-gray-700">Telefono de soporte</span>
            <input
              className="mt-2 w-full border rounded-xl px-3 py-2 text-sm"
              value={configuracion.soporte_telefono ?? ""}
              onChange={(e) => actualizarCampo("soporte_telefono", e.target.value)}
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-gray-700">Titulo principal</span>
            <input
              className="mt-2 w-full border rounded-xl px-3 py-2 text-sm"
              value={configuracion.hero_titulo}
              onChange={(e) => actualizarCampo("hero_titulo", e.target.value)}
            />
          </label>

          <label className="block md:col-span-2">
            <span className="text-sm font-semibold text-gray-700">Texto descriptivo principal</span>
            <textarea
              rows={3}
              className="mt-2 w-full border rounded-xl px-3 py-2 text-sm resize-none"
              value={configuracion.hero_subtitulo}
              onChange={(e) => actualizarCampo("hero_subtitulo", e.target.value)}
            />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-5 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#1565c0]" />
          Vista previa publica
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Los cambios se muestran aqui antes de guardarse.
        </p>

        <div className="overflow-hidden rounded-2xl border border-blue-100 bg-[#0d2b5e] text-white">
          <div className="flex items-center justify-between gap-4 border-b border-white/10 px-5 py-3 text-xs">
            <div className="font-bold">{configuracion.nombre_sistema}</div>
            <div className="rounded-full bg-white/15 px-3 py-1">{configuracion.estado_sistema}</div>
          </div>

          <div className="grid md:grid-cols-[1.5fr_1fr] gap-5 p-6">
            <div>
              <div className="text-sm text-blue-100">{configuracion.escuela_facultad}</div>
              <h4 className="mt-3 text-2xl font-bold leading-tight">
                {configuracion.hero_titulo || configuracion.nombre_sistema}
              </h4>
              <p className="mt-3 text-sm leading-6 text-blue-50">
                {configuracion.hero_subtitulo}
              </p>
              <div className="mt-5 inline-flex rounded-xl bg-[#1565c0] px-4 py-2 text-sm font-semibold">
                {configuracion.ciclo_escolar}
              </div>
            </div>

            <div className="rounded-2xl bg-white p-5 text-[#0d2b5e]">
              <div className="text-xs font-semibold text-gray-500">Convocatoria publicada</div>
              <div className="mt-2 font-bold">{configuracion.convocatoria_nombre}</div>
              <div className="mt-3 grid grid-cols-2 gap-3 text-xs">
                <div className="rounded-xl bg-blue-50 p-3">
                  <div className="text-gray-500">Inicio</div>
                  <div className="font-semibold">{formatearFecha(configuracion.convocatoria_inicio)}</div>
                </div>
                <div className="rounded-xl bg-blue-50 p-3">
                  <div className="text-gray-500">Cierre</div>
                  <div className="font-semibold">{formatearFecha(configuracion.convocatoria_cierre)}</div>
                </div>
              </div>
              <div className="mt-3 text-xs text-gray-500">
                Soporte: {configuracion.correo_institucional}
                {configuracion.soporte_telefono ? ` - ${configuracion.soporte_telefono}` : ""}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#1565c0]" />
            Convocatoria publicada
          </h3>

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-semibold text-gray-700">Seleccionar desde catalogo</span>
              <select
                className="mt-2 w-full border rounded-xl px-3 py-2 text-sm bg-white"
                value={configuracion.id_convocatoria_principal ?? ""}
                onChange={(e) => seleccionarConvocatoria(e.target.value)}
              >
                <option value="" disabled>
                  Selecciona una convocatoria
                </option>
                {convocatorias.map((convocatoria) => (
                  <option key={convocatoria.id_convocatoria} value={convocatoria.id_convocatoria}>
                    {convocatoria.nombre} - {convocatoria.tipo_periodo}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500">Inicio</div>
                <div className="font-semibold text-[#0d2b5e]">
                  {formatearFecha(convocatoriaSeleccionada?.fecha_inicio_general ?? configuracion.convocatoria_inicio)}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500">Cierre</div>
                <div className="font-semibold text-[#0d2b5e]">
                  {formatearFecha(convocatoriaSeleccionada?.fecha_cierre_general ?? configuracion.convocatoria_cierre)}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500">Estado</div>
                <div className="font-semibold text-[#0d2b5e]">
                  {convocatoriaSeleccionada?.estado ?? configuracion.convocatoria_estado ?? "Sin estado"}
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500">Inicio registro empresas</div>
                <div className="font-semibold text-[#0d2b5e]">
                  {formatearFecha(
                    convocatoriaSeleccionada?.fecha_inicio_empresas ??
                      configuracion.convocatoria_empresas_inicio,
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500">Cierre registro empresas</div>
                <div className="font-semibold text-[#0d2b5e]">
                  {formatearFecha(
                    convocatoriaSeleccionada?.fecha_cierre_empresas ??
                      configuracion.convocatoria_empresas_cierre,
                  )}
                </div>
              </div>

              <div className={`rounded-xl border p-4 ${inscripcionVisual.clase}`}>
                <div className="text-xs">Registro empresas</div>
                <div className="font-semibold">{configuracion.inscripcion_empresas_estado}</div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-[#0d2b5e]">
                Las fechas y el nombre vienen de Catalogos &gt; Convocatorias. Aqui eliges cual se publica en la pagina principal y en el calendario.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#1565c0]" />
            Resumen de registros
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-700">{estadisticas?.alumnos ?? 0}</div>
              <div className="text-sm text-green-600">Alumnos registrados</div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-orange-700">{estadisticas?.usuarios ?? 0}</div>
              <div className="text-sm text-orange-600">Usuarios totales</div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-700">{formatearFecha(configuracion.ultima_actualizacion)}</div>
              <div className="text-sm text-blue-600">Ultima actualizacion</div>
            </div>
          </div>

          <div className="mt-5 bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm text-orange-700">
              Los contadores provienen de la base de datos; el contenido publico se actualiza al guardar.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#1565c0]" />
            Estado administrativo
          </h3>

          <div className="space-y-3">
            {estadoAdministrativo.map(([item, activo]) => (
              <div key={item} className="flex items-center gap-3 text-sm text-gray-700">
                <CheckCircle2 className={`w-5 h-5 ${activo ? "text-green-600" : "text-gray-400"}`} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button
          onClick={guardarCambios}
          disabled={guardando}
          className="bg-[#1565c0] text-white rounded-xl px-5 py-2 text-sm font-semibold flex items-center gap-2 disabled:opacity-60"
        >
          <Save className="w-4 h-4" />
          {guardando ? "Guardando..." : "Guardar cambios"}
        </button>
      </div>

      {mostrarConfirmacionEstado && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={() => setMostrarConfirmacionEstado(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`rounded-xl border p-4 ${confirmacionEstado.clase}`}>
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-bold text-lg">{confirmacionEstado.titulo}</h3>
                  <p className="text-sm mt-2">{confirmacionEstado.mensaje}</p>
                  {confirmacionEstado.extra && (
                    <p className="text-sm mt-2">{confirmacionEstado.extra}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-gray-50 border border-gray-200 p-3 text-sm text-gray-600">
              Cambio pendiente: {estadoSistemaOriginal} {"->"} {configuracion.estado_sistema}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button
                onClick={() => setMostrarConfirmacionEstado(false)}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-semibold hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={confirmarCambioEstado}
                disabled={guardando}
                className="px-4 py-2.5 rounded-xl bg-[#1565c0] text-white text-sm font-semibold hover:bg-[#0d2b5e] disabled:opacity-60"
              >
                {guardando ? "Guardando..." : confirmacionEstado.confirmar}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
