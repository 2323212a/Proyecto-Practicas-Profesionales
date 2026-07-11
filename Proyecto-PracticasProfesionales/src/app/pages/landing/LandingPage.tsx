import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Building2,
  Calendar,
  ChevronRight,
  FileText,
  GraduationCap,
} from "lucide-react";

import logoInstitucional from "../../../assets/Ocelote1.png";
import { gestionConfiguracionUseCase } from "../../dependencies";
import type { ConfiguracionSistema } from "../../../domain/configuracion/ConfiguracionSistema";

const CONFIG_DEFAULT: ConfiguracionSistema = {
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
    year: "numeric",
  }).format(date);
}

function formatearFechaCorta(fecha?: string | null) {
  if (!fecha) return "Sin fecha";
  const date = new Date(`${fecha}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Sin fecha";
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

export function LandingPage() {
  const navigate = useNavigate();
  const [configuracion, setConfiguracion] = useState(CONFIG_DEFAULT);

  useEffect(() => {
    gestionConfiguracionUseCase
      .obtener()
      .then(setConfiguracion)
      .catch((error) => console.error(error));
  }, []);

  const estadoConvocatoria = configuracion.convocatoria_estado ?? "Pendiente";
  const convocatoriaColor =
    estadoConvocatoria === "Finalizada" || estadoConvocatoria === "Vencida"
      ? "bg-orange-500"
      : estadoConvocatoria === "Activa"
        ? "bg-green-500"
        : "bg-blue-500";

  const fechas = [
    {
      fecha: formatearFechaCorta(configuracion.convocatoria_inicio),
      evento: `Inicio de ${configuracion.convocatoria_nombre}`,
      estado: estadoConvocatoria,
    },
    {
      fecha: formatearFechaCorta(configuracion.convocatoria_cierre),
      evento: `Cierre de ${configuracion.convocatoria_nombre}`,
      estado: "Proximo",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-[#0d2b5e] shadow-lg">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-[#0d2b5e] rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
              <img src={logoInstitucional} alt="UNACH" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-white font-bold text-lg leading-tight">UNACH</div>
              <div className="text-blue-200 text-xs">{configuracion.escuela_facultad}</div>
            </div>
          </div>
          <div className="hidden md:block text-white font-semibold text-base">
            {configuracion.nombre_sistema}
          </div>
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2 bg-[#1565c0] text-white rounded-lg hover:bg-[#1976d2] transition-colors font-medium text-sm shadow"
          >
            Iniciar Sesion
          </button>
        </div>
      </nav>

      <div className="bg-gradient-to-br from-[#0d2b5e] via-[#1565c0] to-[#1976d2] text-white py-20 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="max-w-3xl">
            <div className="inline-block bg-white/20 text-white text-xs font-semibold px-4 py-1 rounded-full mb-6 uppercase tracking-wider">
              {configuracion.ciclo_escolar}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-6">
              {configuracion.hero_titulo}
            </h1>
            <p className="text-blue-100 text-lg mb-8 leading-relaxed max-w-2xl">
              {configuracion.hero_subtitulo}
            </p>
            <button
              onClick={() => navigate("/login")}
              className="px-8 py-3 bg-white text-[#0d2b5e] rounded-xl font-bold hover:bg-blue-50 transition-colors shadow-lg"
            >
              Acceder al Sistema
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 flex flex-col lg:flex-row gap-8">
        <div className="flex-1">
          <h2 className="text-2xl font-bold text-[#0d2b5e] mb-6">
            Convocatoria Principal
          </h2>
          <div className="grid md:grid-cols-2 gap-6 mb-10">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              <div className={`${convocatoriaColor} h-2`} />
              <div className="p-6">
                <div className="flex items-start justify-between mb-3 gap-4">
                  <h3 className="font-bold text-[#0d2b5e] text-lg leading-tight">
                    {configuracion.convocatoria_nombre}
                  </h3>
                  <span className="text-xs px-3 py-1 rounded-full font-semibold bg-green-100 text-green-700">
                    {estadoConvocatoria}
                  </span>
                </div>
                <div className="text-gray-500 text-sm flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5" />
                  {formatearFecha(configuracion.convocatoria_inicio)} - {formatearFecha(configuracion.convocatoria_cierre)}
                </div>
                <div className="text-red-500 text-xs font-medium mt-2">
                  Cierre: {formatearFecha(configuracion.convocatoria_cierre)}
                </div>
                <button
                  onClick={() => navigate("/login")}
                  className="mt-4 w-full py-2 bg-[#0d2b5e] text-white rounded-lg text-sm font-medium hover:bg-[#1565c0] transition-colors flex items-center justify-center gap-2"
                >
                  Ver detalles <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-bold text-[#0d2b5e] mb-6">
            Fechas Importantes
          </h2>
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-[#0d2b5e] text-white px-6 py-4 flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              <span className="font-semibold">Calendario Oficial</span>
            </div>
            <div className="divide-y divide-gray-100">
              {fechas.map((fecha) => (
                <div
                  key={fecha.evento}
                  className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-20 text-center">
                      <div className="font-bold text-[#0d2b5e] text-sm">
                        {fecha.fecha}
                      </div>
                    </div>
                    <div className="text-gray-700 text-sm">{fecha.evento}</div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-600">
                    {fecha.estado}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 space-y-6">
          {[
            {
              icono: <GraduationCap className="w-6 h-6 text-[#1565c0]" />,
              titulo: "ALUMNO",
              descripcion:
                "Gestiona tu proceso de practicas de forma digital. Sube documentos y consulta el estado de tu expediente.",
              extra: "Requisitos: cumplir los creditos y condiciones establecidos por la institucion.",
              boton: "Iniciar Documentacion",
              ruta: "/login",
              color: "bg-[#0d2b5e]",
            },
            {
              icono: <Building2 className="w-6 h-6 text-green-600" />,
              titulo: "EMPRESA NUEVA",
              descripcion:
                "Registra tu empresa como unidad receptora y publica ofertas para alumnos.",
              extra: `${configuracion.convocatoria_nombre} disponible`,
              boton: "Registrar Unidad",
              ruta: "/registro-empresa",
              color: "bg-green-600",
            },
            {
              icono: <FileText className="w-6 h-6 text-orange-500" />,
              titulo: "ACTUALIZACION DE DATOS",
              descripcion:
                "Si ya estas registrado, solicita la actualizacion de informacion de forma segura.",
              extra: "La actualizacion requiere autorizacion del coordinador.",
              boton: "Actualizar Datos",
              ruta: "/login",
              color: "bg-orange-500",
            },
          ].map((seccion) => (
            <div
              key={seccion.titulo}
              className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center">
                  {seccion.icono}
                </div>
                <h3 className="font-bold text-[#0d2b5e] text-sm tracking-wide">
                  {seccion.titulo}
                </h3>
              </div>
              <p className="text-gray-600 text-xs leading-relaxed">
                {seccion.descripcion}
              </p>
              <div className="text-xs text-gray-500 mt-2">{seccion.extra}</div>
              <button
                onClick={() => navigate(seccion.ruta)}
                className={`mt-4 w-full py-2.5 ${seccion.color} text-white rounded-xl text-sm font-semibold hover:opacity-90 transition-opacity`}
              >
                {seccion.boton}
              </button>
            </div>
          ))}
        </div>
      </div>

      <footer className="bg-[#0d2b5e] text-white mt-8 py-10 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-16 h-16 bg-[#0d2b5e] rounded-lg overflow-hidden">
                <img
                  src={logoInstitucional}
                  alt="UNACH"
                  className="w-full h-full object-contain"
                />
              </div>
              <div>
                <div className="font-bold text-lg">UNACH</div>
                <div className="text-blue-300 text-xs">{configuracion.escuela_facultad}</div>
              </div>
            </div>
            <p className="text-blue-200 text-sm">
              {configuracion.nombre_sistema} © 2026
            </p>
          </div>
          <div className="text-blue-300 text-sm">
            <div className="font-semibold text-white mb-2">Soporte Tecnico</div>
            <div>{configuracion.correo_institucional}</div>
            <div>{configuracion.soporte_telefono}</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
