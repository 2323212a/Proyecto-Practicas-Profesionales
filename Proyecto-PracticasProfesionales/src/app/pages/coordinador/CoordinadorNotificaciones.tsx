import {
  Bell,
  FileWarning,
  AlertTriangle,
  CheckCircle2,
  FileCheck,
  Clock,
} from "lucide-react";

const notificaciones = [
  {
    tipo: "documento",
    titulo: "Documentos pendientes de revisión",
    descripcion:
      "Carlos López Ramos subió nueva documentación para validación.",
    fecha: "Hace 15 min",
  },
  {
    tipo: "correccion",
    titulo: "Corrección solicitada",
    descripcion:
      "Laura Martínez volvió a enviar su carta compromiso corregida.",
    fecha: "Hace 1 hora",
  },
  {
    tipo: "incidencia",
    titulo: "Incidencia reportada",
    descripcion:
      "Brayan Madain Hernández tiene una observación registrada por la empresa.",
    fecha: "Hoy",
  },
  {
    tipo: "liberacion",
    titulo: "Alumno listo para liberación",
    descripcion:
      "Miguel Torres Flores completó horas, reportes y evidencias finales.",
    fecha: "Hoy",
  },
  {
    tipo: "documento",
    titulo: "Nuevo documento recibido",
    descripcion:
      "Patricia Álvarez Mora cargó su vigencia de derechos actualizada.",
    fecha: "Ayer",
  },
];

const estilos = {
  documento: {
    icon: FileCheck,
    color: "bg-blue-50 border-blue-200 text-blue-700",
  },
  correccion: {
    icon: FileWarning,
    color: "bg-yellow-50 border-yellow-200 text-yellow-700",
  },
  incidencia: {
    icon: AlertTriangle,
    color: "bg-red-50 border-red-200 text-red-700",
  },
  liberacion: {
    icon: CheckCircle2,
    color: "bg-green-50 border-green-200 text-green-700",
  },
};

export function CoordinadorNotificaciones() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Notificaciones
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          Actividades recientes y elementos que requieren atención de coordinación.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          [
            "Documentos pendientes",
            "12",
            FileCheck,
            "bg-blue-600",
          ],
          [
            "Correcciones",
            "5",
            FileWarning,
            "bg-yellow-500",
          ],
          [
            "Incidencias",
            "3",
            AlertTriangle,
            "bg-red-500",
          ],
          [
            "Listos para liberar",
            "8",
            CheckCircle2,
            "bg-green-600",
          ],
        ].map(([titulo, valor, Icon, color]: any) => (
          <div
            key={titulo}
            className={`${color} rounded-2xl p-5 text-white`}
          >
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
              <div
                key={index}
                className="p-5 hover:bg-gray-50 transition-colors"
              >
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

                    <div className="mt-3">
                      <button className="text-[#1565c0] text-sm font-semibold hover:underline">
                        Ver detalle
                      </button>
                    </div>
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
            Las notificaciones muestran eventos relacionados con validación de documentos, seguimiento e inicio del proceso de liberación.
          </p>
        </div>
      </div>
    </div>
  );
}