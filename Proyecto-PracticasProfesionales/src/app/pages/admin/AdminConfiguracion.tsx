import { useEffect, useMemo, useState } from "react";
import {
  CalendarDays,
  CheckCircle2,
  GraduationCap,
  Mail,
  Save,
  Settings,
  Upload,
  Users,
} from "lucide-react";

import { gestionConfiguracionUseCase } from "../../dependencies";
import { obtenerEstadisticasAdmin } from "../../../infrastructure/admin/adminEstadisticasApi";
import { obtenerConvocatorias } from "../../../infrastructure/catalogos/catalogosApi";
import type { ConfiguracionSistema } from "../../../domain/configuracion/ConfiguracionSistema";

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
  periodo: string;
  fecha_inicio: string;
  fecha_fin: string;
  estado: string;
};

const CONFIG_INICIAL: ConfiguracionSistema = {
  nombre_sistema: "Sistema Integral de Practicas Profesionales",
  escuela_facultad: "ETDA C-I",
  correo_institucional: "practicas@unach.mx",
  estado_sistema: "Activo",
  ciclo_escolar: "Ciclo escolar vigente",
  hero_titulo: "Sistema Integral de Practicas Profesionales",
  hero_subtitulo:
    "Plataforma institucional para la gestion, seguimiento y control de las practicas profesionales.",
  id_convocatoria_principal: null,
  convocatoria_nombre: "Sin convocatoria principal",
  convocatoria_inicio: null,
  convocatoria_cierre: null,
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

export function AdminConfiguracion() {
  const [configuracion, setConfiguracion] = useState<ConfiguracionSistema>(CONFIG_INICIAL);
  const [estadisticas, setEstadisticas] = useState<EstadisticasAdmin | null>(null);
  const [convocatorias, setConvocatorias] = useState<ConvocatoriaCatalogo[]>([]);
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    void cargarDatos();
  }, []);

  async function cargarDatos() {
    try {
      const [configData, estadisticasData, convocatoriasData] = await Promise.all([
        gestionConfiguracionUseCase.obtener(),
        obtenerEstadisticasAdmin(),
        obtenerConvocatorias(),
      ]);
      setConfiguracion(configData);
      setEstadisticas(estadisticasData);
      setConvocatorias(convocatoriasData);
    } catch (error) {
      console.error(error);
      setMensaje("No se pudieron cargar todos los datos de configuracion.");
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
      convocatoria_inicio: convocatoria?.fecha_inicio ?? actual.convocatoria_inicio,
      convocatoria_cierre: convocatoria?.fecha_fin ?? actual.convocatoria_cierre,
      convocatoria_periodo: convocatoria?.periodo ?? actual.convocatoria_periodo,
      convocatoria_estado: convocatoria?.estado ?? actual.convocatoria_estado,
    }));
  }

  async function guardarCambios() {
    try {
      setGuardando(true);
      setMensaje("");
      const guardada = await gestionConfiguracionUseCase.guardar(configuracion);
      setConfiguracion(guardada);
      setMensaje("Configuracion guardada correctamente.");
    } catch (error) {
      console.error(error);
      setMensaje("No se pudo guardar la configuracion.");
    } finally {
      setGuardando(false);
    }
  }

  const convocatoriaSeleccionada = useMemo(
    () =>
      convocatorias.find(
        (item) => item.id_convocatoria === configuracion.id_convocatoria_principal,
      ),
    [convocatorias, configuracion.id_convocatoria_principal],
  );

  const tarjetas = [
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">Configuracion</h1>
        <p className="text-gray-500 text-sm mt-1">
          Parametros institucionales y contenido visible en la pagina principal.
        </p>
      </div>

      {mensaje && (
        <div className="bg-blue-50 border border-blue-200 text-[#0d2b5e] rounded-xl p-4 text-sm">
          {mensaje}
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        {tarjetas.map(([titulo, valor, Icon, color]: any) => (
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
          Configuracion Institucional
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
                    {convocatoria.nombre} - {convocatoria.periodo}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500">Inicio</div>
                <div className="font-semibold text-[#0d2b5e]">
                  {formatearFecha(convocatoriaSeleccionada?.fecha_inicio ?? configuracion.convocatoria_inicio)}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500">Cierre</div>
                <div className="font-semibold text-[#0d2b5e]">
                  {formatearFecha(convocatoriaSeleccionada?.fecha_fin ?? configuracion.convocatoria_cierre)}
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-4">
                <div className="text-xs text-gray-500">Estado</div>
                <div className="font-semibold text-[#0d2b5e]">
                  {convocatoriaSeleccionada?.estado ?? configuracion.convocatoria_estado ?? "Sin estado"}
                </div>
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
            <Mail className="w-5 h-5 text-[#1565c0]" />
            Notificaciones del sistema
          </h3>

          <div className="space-y-3">
            {[
              "Notificar al alumno cuando su cuenta sea creada",
              "Avisar al administrador sobre errores de carga masiva",
              "Enviar aviso cuando una convocatoria este por cerrar",
            ].map((item) => (
              <label key={item} className="flex items-center gap-3 text-sm text-gray-700">
                <input type="checkbox" defaultChecked className="w-4 h-4" />
                {item}
              </label>
            ))}
          </div>
        </div>

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
    </div>
  );
}
