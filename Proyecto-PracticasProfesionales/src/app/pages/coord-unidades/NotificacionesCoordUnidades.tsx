import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Bell,
  Briefcase,
  Building2,
  CheckCircle2,
  Clock,
  Eye,
  FileWarning,
} from "lucide-react";
import {
  listarNotificaciones,
  type NotificacionApi,
} from "../../../infrastructure/coord-unidades/notificacionesApi";

const estilos = {
  empresa: {
    icon: Building2,
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  correccion: {
    icon: FileWarning,
    color: "bg-yellow-50 border-yellow-200 text-yellow-700",
  },
  convenio: {
    icon: AlertTriangle,
    color: "bg-orange-50 border-orange-200 text-orange-700",
  },
  vacante: {
    icon: Briefcase,
    color: "bg-purple-50 border-purple-200 text-purple-700",
  },
  padron: {
    icon: CheckCircle2,
    color: "bg-green-50 border-green-200 text-green-700",
  },
  general: {
    icon: Bell,
    color: "bg-gray-50 border-gray-200 text-gray-700",
  },
};

function obtenerEstilo(tipo: string) {
  const key = tipo.toLowerCase() as keyof typeof estilos;
  return estilos[key] || estilos.general;
}

function formatearFecha(fecha?: string | null) {
  if (!fecha) return "Sin fecha";
  return new Date(fecha).toLocaleDateString("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function NotificacionesCoordUnidades() {
  const [notificaciones, setNotificaciones] = useState<NotificacionApi[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function cargar() {
      try {
        setCargando(true);
        setError(null);
        const data = await listarNotificaciones();
        setNotificaciones(data);
      } catch {
        setError("No se pudieron cargar las notificaciones.");
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, []);

  const resumen = useMemo(() => {
    const porTipo = (tipo: string) =>
      notificaciones.filter((n) => n.tipo.toLowerCase() === tipo).length;

    return [
      ["Empresas", porTipo("empresa"), Building2, "bg-blue-600"],
      ["Correcciones", porTipo("correccion"), FileWarning, "bg-yellow-500"],
      ["Convenios", porTipo("convenio"), AlertTriangle, "bg-orange-500"],
      ["Vacantes", porTipo("vacante"), Briefcase, "bg-purple-600"],
      ["Padron", porTipo("padron"), CheckCircle2, "bg-green-600"],
    ];
  }, [notificaciones]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Notificaciones
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Alertas relacionadas con empresas, convenios, vacantes y padron empresarial.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {resumen.map(([titulo, valor, Icon, color]: any) => (
          <div key={titulo} className={`${color} rounded-2xl p-5 text-white`}>
            <Icon className="w-7 h-7 mb-3 opacity-80" />
            <div className="text-2xl font-bold">{valor}</div>
            <div className="text-white/80 text-sm">{titulo}</div>
          </div>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-2xl p-4 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">
            Actividad reciente
          </h3>
        </div>

        {cargando && (
          <div className="p-10 text-center text-gray-400">
            Cargando notificaciones...
          </div>
        )}

        {!cargando && notificaciones.length === 0 && (
          <div className="p-10 text-center text-gray-400">
            No hay notificaciones registradas.
          </div>
        )}

        {!cargando && notificaciones.length > 0 && (
          <div className="divide-y divide-gray-100">
            {notificaciones.map((n) => {
              const config = obtenerEstilo(n.tipo);
              const Icon = config.icon;

              return (
                <div key={n.id_notificacion} className="p-5 hover:bg-gray-50">
                  <div className="flex gap-4">
                    <div
                      className={`w-12 h-12 rounded-xl border flex items-center justify-center ${config.color}`}
                    >
                      <Icon className="w-5 h-5" />
                    </div>

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-semibold text-[#0d2b5e]">
                            {n.titulo}
                          </h4>

                          <p className="text-sm text-gray-600 mt-1">
                            {n.mensaje}
                          </p>
                        </div>

                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {formatearFecha(n.fecha_envio)}
                        </span>
                      </div>

                      <button className="mt-3 text-[#1565c0] text-sm font-semibold hover:underline flex items-center gap-1">
                        <Eye className="w-4 h-4" />
                        Ver detalle
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-[#1565c0]" />
          <p className="text-sm text-[#0d2b5e]">
            Estas notificaciones ayudan a dar seguimiento a solicitudes de empresas,
            renovacion de convenios, aprobacion de vacantes y publicacion en el padron.
          </p>
        </div>
      </div>
    </div>
  );
}
