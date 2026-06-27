import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  Users,
  Shield,
  Settings,
  BarChart3,
  ClipboardList,
  TrendingUp,
  GraduationCap,
  FileText,
} from "lucide-react";

import { obtenerEstadisticasAdmin } from "../../../infrastructure/admin/adminEstadisticasApi";

export function AdminDashboard() {
  const navigate = useNavigate();
  const [estadisticas, setEstadisticas] = useState<any>(null);

  useEffect(() => {
    cargarEstadisticas();
  }, []);

  async function cargarEstadisticas() {
    const data = await obtenerEstadisticasAdmin();
    setEstadisticas(data);
  }

  const widgets = [
    {
      l: "Usuarios Totales",
      v: estadisticas?.usuarios ?? 0,
      I: Users,
      c: "bg-blue-50 text-blue-600",
      t: `${estadisticas?.usuarios_activos ?? 0} activos`,
    },
    {
      l: "Roles Activos",
      v: estadisticas?.roles ?? 0,
      I: Shield,
      c: "bg-purple-50 text-purple-600",
      t: "Roles registrados",
    },
    {
      l: "Catálogos",
      v: estadisticas?.catalogos_total ?? 0,
      I: ClipboardList,
      c: "bg-green-50 text-green-600",
      t: "Carreras, convocatorias y documentos",
    },
    {
      l: "Alumnos",
      v: estadisticas?.alumnos ?? 0,
      I: GraduationCap,
      c: "bg-orange-50 text-orange-600",
      t: "Alumnos registrados",
    },
  ];

  const modulos = [
    {
      I: Users,
      l: "Gestión de Usuarios",
      d: "Crear, editar, eliminar y desactivar usuarios del sistema",
      p: "/admin/usuarios",
      g: "from-blue-600 to-blue-500",
    },
    {
      I: Shield,
      l: "Roles y Permisos",
      d: "Consultar roles de acceso y permisos por módulo",
      p: "/admin/roles",
      g: "from-purple-600 to-purple-500",
    },
    {
      I: ClipboardList,
      l: "Catálogos",
      d: "Gestionar carreras, convocatorias y tipos de documento",
      p: "/admin/catalogos",
      g: "from-green-600 to-green-500",
    },
    {
      I: BarChart3,
      l: "Reportes",
      d: "Generar y consultar reportes estadísticos del sistema",
      p: "/admin/reportes",
      g: "from-orange-500 to-orange-400",
    },
    {
      I: Settings,
      l: "Configuración",
      d: "Parámetros generales del sistema",
      p: "/admin/configuracion",
      g: "from-gray-700 to-gray-600",
    },
  ];

  const resumenSistema = [
    {
      l: "Usuarios activos",
      s: `${estadisticas?.usuarios_activos ?? 0}`,
      c: "text-green-600",
      d: "bg-green-500",
    },
    {
      l: "Usuarios inactivos",
      s: `${estadisticas?.usuarios_inactivos ?? 0}`,
      c: "text-gray-600",
      d: "bg-gray-500",
    },
    {
      l: "Expedientes",
      s: `${estadisticas?.expedientes ?? 0}`,
      c: "text-blue-600",
      d: "bg-blue-500",
    },
    {
      l: "Documentos",
      s: `${estadisticas?.documentos ?? 0}`,
      c: "text-purple-600",
      d: "bg-purple-500",
    },
    {
      l: "Convocatorias",
      s: `${estadisticas?.convocatorias ?? 0}`,
      c: "text-orange-600",
      d: "bg-orange-500",
    },
    {
      l: "Tipos de documento",
      s: `${estadisticas?.tipos_documento ?? 0}`,
      c: "text-green-600",
      d: "bg-green-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Dashboard Administrativo
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Panel de control del sistema · Administrador General
        </p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {widgets.map((w) => (
          <div
            key={w.l}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5"
          >
            <div
              className={`w-10 h-10 ${w.c} rounded-xl flex items-center justify-center mb-3`}
            >
              <w.I className="w-5 h-5" />
            </div>
            <div className="text-2xl font-bold text-[#0d2b5e]">
              {w.v}
            </div>
            <div className="text-gray-500 text-sm mt-0.5">
              {w.l}
            </div>
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              {w.t}
            </div>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {modulos.map((m) => (
          <button
            key={m.l}
            onClick={() => navigate(m.p)}
            className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 text-left hover:shadow-md transition-shadow group"
          >
            <div
              className={`w-12 h-12 bg-gradient-to-br ${m.g} rounded-2xl flex items-center justify-center mb-4`}
            >
              <m.I className="w-6 h-6 text-white" />
            </div>
            <div className="font-bold text-[#0d2b5e] mb-1 group-hover:text-[#1565c0] transition-colors">
              {m.l}
            </div>
            <div className="text-gray-500 text-xs leading-relaxed">
              {m.d}
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-4">
          Resumen del Sistema
        </h3>

        <div className="grid md:grid-cols-3 gap-4">
          {resumenSistema.map((s) => (
            <div
              key={s.l}
              className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl"
            >
              <div
                className={`w-2.5 h-2.5 rounded-full ${s.d} flex-shrink-0`}
              />
              <div>
                <div className="text-xs text-gray-500">
                  {s.l}
                </div>
                <div className={`text-sm font-semibold ${s.c}`}>
                  {s.s}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}