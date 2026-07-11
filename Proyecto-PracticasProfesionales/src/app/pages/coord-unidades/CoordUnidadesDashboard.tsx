import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Building2,
  ChevronRight,
  ClipboardList,
  FileText,
} from "lucide-react";

import type { CoordUnidadesDashboardResponse } from "../../../domain/coord-unidades/CoordUnidadesDashboard";
import { obtenerDashboardCoordUnidades } from "../../../infrastructure/coord-unidades/coordUnidadesDashboardApi";

export function CoordUnidadesDashboard() {
  const navigate = useNavigate();
  const [datos, setDatos] = useState<CoordUnidadesDashboardResponse | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    void cargar();
  }, []);

  async function cargar() {
    try {
      setCargando(true);
      setError("");
      setDatos(await obtenerDashboardCoordUnidades());
    } catch (err) {
      console.error(err);
      setError("No se pudo cargar el dashboard de unidades receptoras.");
    } finally {
      setCargando(false);
    }
  }

  const resumen = datos?.resumen;

  const tarjetas = [
    {
      label: "Empresas pendientes",
      value: resumen?.empresas_pendientes ?? 0,
      icon: Building2,
      color: "bg-orange-500",
    },
    {
      label: "Documentos pendientes",
      value: resumen?.documentos_pendientes ?? 0,
      icon: FileText,
      color: "bg-blue-600",
    },
    {
      label: "Vacantes activas",
      value: resumen?.vacantes_activas ?? 0,
      icon: Briefcase,
      color: "bg-purple-600",
    },
    {
      label: "Empresas publicadas",
      value: resumen?.empresas_publicadas ?? 0,
      icon: ClipboardList,
      color: "bg-green-600",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Dashboard - Coordinador de Unidades Receptoras
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Seguimiento de empresas, convenios, vacantes y publicacion en padron empresarial.
        </p>
      </div>

      {error && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3 text-sm text-orange-700">
          {error}
        </div>
      )}

      <div className="grid md:grid-cols-4 gap-4">
        {tarjetas.map((item) => (
          <div
            key={item.label}
            className={`${item.color} rounded-2xl p-5 text-white`}
          >
            <item.icon className="w-7 h-7 mb-3 opacity-80" />
            <div className="text-2xl font-bold">{cargando ? "..." : item.value}</div>
            <div className="text-white/80 text-sm">
              {item.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5">
            Flujo de incorporacion de empresas
          </h3>

          <div className="space-y-4">
            {(datos?.pipeline ?? []).map((p, index) => (
              <div key={p.etapa} className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1565c0] flex items-center justify-center font-bold">
                  {index + 1}
                </div>

                <div className="flex-1 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="font-semibold text-[#0d2b5e]">
                        {p.etapa}
                      </p>
                      <p className="text-sm text-gray-500">
                        {p.detalle}
                      </p>
                    </div>

                    <div className="text-2xl font-bold text-[#0d2b5e]">
                      {p.cantidad}
                    </div>
                  </div>
                </div>

                {index < (datos?.pipeline.length ?? 0) - 1 && (
                  <ChevronRight className="w-5 h-5 text-gray-300 hidden md:block" />
                )}
              </div>
            ))}

            {!cargando && (datos?.pipeline ?? []).length === 0 && (
              <div className="text-sm text-gray-500">No hay datos de flujo registrados.</div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-5 flex items-center gap-2">
              <Bell className="w-5 h-5 text-[#1565c0]" />
              Actividad reciente
            </h3>

            <div className="space-y-3">
              {(datos?.actividad ?? []).map((item) => (
                <div
                  key={item.id_bitacora}
                  className="border border-gray-200 rounded-xl p-4 text-sm text-gray-700"
                >
                  <div className="font-semibold text-[#0d2b5e]">{item.texto}</div>
                  {item.detalle && <div className="text-xs text-gray-500 mt-1">{item.detalle}</div>}
                </div>
              ))}
              {!cargando && (datos?.actividad ?? []).length === 0 && (
                <div className="text-sm text-gray-500">Sin actividad registrada.</div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-[#0d2b5e] mb-5 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-600" />
              Alertas
            </h3>

            <div className="space-y-3">
              {(datos?.alertas ?? []).map((item) => (
                <div
                  key={item}
                  className="bg-orange-50 border border-orange-200 rounded-xl p-4 text-sm text-orange-700"
                >
                  {item}
                </div>
              ))}
              {!cargando && (datos?.alertas ?? []).length === 0 && (
                <div className="text-sm text-gray-500">No hay alertas pendientes.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-5">
          Accesos rapidos
        </h3>

        <div className="grid md:grid-cols-4 gap-4">
          {[
            {
              title: "Revisar empresas",
              subtitle: "Solicitudes y expedientes",
              icon: Building2,
              path: "/coord-unidades/empresas",
              style: "bg-[#0d2b5e] text-white",
            },
            {
              title: "Gestionar convenios",
              subtitle: "Vigencias y renovaciones",
              icon: FileText,
              path: "/coord-unidades/convenios",
              style: "bg-blue-50 text-[#1565c0] border border-blue-200",
            },
            {
              title: "Revisar vacantes",
              subtitle: "Plan de trabajo",
              icon: Briefcase,
              path: "/coord-unidades/vacantes",
              style: "bg-purple-50 text-purple-700 border border-purple-200",
            },
            {
              title: "Padron empresarial",
              subtitle: "Empresas visibles",
              icon: ClipboardList,
              path: "/coord-unidades/padron",
              style: "bg-green-50 text-green-700 border border-green-200",
            },
          ].map((item) => (
            <button
              key={item.title}
              onClick={() => navigate(item.path)}
              className={`${item.style} rounded-2xl p-5 flex flex-col items-start gap-3 hover:shadow-md transition-all text-left`}
            >
              <item.icon className="w-6 h-6" />

              <div>
                <div className="font-bold">{item.title}</div>
                <div className="text-xs opacity-70 mt-0.5">
                  {item.subtitle}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
