import {
  Bell,
  Building2,
  FileWarning,
  AlertTriangle,
  CheckCircle2,
  Briefcase,
  Clock,
  Eye,
} from "lucide-react";

const notificaciones = [
  {
    tipo: "empresa",
    titulo: "Nueva empresa registrada",
    descripcion: "DevSolutions Chiapas envió solicitud de alta como unidad receptora.",
    fecha: "Hace 20 min",
  },
  {
    tipo: "correccion",
    titulo: "Corrección pendiente",
    descripcion: "Innovatek debe actualizar el comprobante de domicilio.",
    fecha: "Hace 1 hora",
  },
  {
    tipo: "convenio",
    titulo: "Convenio por vencer",
    descripcion: "El convenio de Chiapas Digital vence en 15 días.",
    fecha: "Hoy",
  },
  {
    tipo: "vacante",
    titulo: "Vacantes pendientes de aprobación",
    descripcion: "DataLab MX registró 4 vacantes con plan de trabajo en revisión.",
    fecha: "Hoy",
  },
  {
    tipo: "padron",
    titulo: "Empresa lista para publicar",
    descripcion: "TechSoft Chiapas cumple requisitos para aparecer en el padrón empresarial.",
    fecha: "Ayer",
  },
];

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
};

export function NotificacionesCoordUnidades() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Notificaciones
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Alertas relacionadas con empresas, convenios, vacantes y padrón empresarial.
        </p>
      </div>

      <div className="grid md:grid-cols-5 gap-4">
        {[
          ["Nuevas empresas", "4", Building2, "bg-blue-600"],
          ["Correcciones", "6", FileWarning, "bg-yellow-500"],
          ["Convenios por vencer", "3", AlertTriangle, "bg-orange-500"],
          ["Vacantes pendientes", "8", Briefcase, "bg-purple-600"],
          ["Listas para padrón", "5", CheckCircle2, "bg-green-600"],
        ].map(([titulo, valor, Icon, color]: any) => (
          <div key={titulo} className={`${color} rounded-2xl p-5 text-white`}>
            <Icon className="w-7 h-7 mb-3 opacity-80" />
            <div className="text-2xl font-bold">{valor}</div>
            <div className="text-white/80 text-sm">{titulo}</div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
          <Bell className="w-5 h-5 text-[#1565c0]" />
          <h3 className="font-bold text-[#0d2b5e]">
            Actividad reciente
          </h3>
        </div>

        <div className="divide-y divide-gray-100">
          {notificaciones.map((n, index) => {
            const config = estilos[n.tipo as keyof typeof estilos];
            const Icon = config.icon;

            return (
              <div key={index} className="p-5 hover:bg-gray-50">
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
                          {n.descripcion}
                        </p>
                      </div>

                      <span className="text-xs text-gray-400 whitespace-nowrap">
                        {n.fecha}
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
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-[#1565c0]" />
          <p className="text-sm text-[#0d2b5e]">
            Estas notificaciones ayudan a dar seguimiento a solicitudes de empresas, renovación de convenios, aprobación de vacantes y publicación en el padrón.
          </p>
        </div>
      </div>
    </div>
  );
}