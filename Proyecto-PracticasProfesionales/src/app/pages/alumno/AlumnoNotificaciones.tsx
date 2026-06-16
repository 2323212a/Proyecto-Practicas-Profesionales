import { useState } from "react";
import {
  Bell,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Check,
  Eye,
  X,
  MessageSquare,
  UserRound,
} from "lucide-react";

type NT = "aprobado" | "rechazado" | "advertencia" | "info";

interface N {
  id: number;
  tipo: NT;
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  remitente?: string;
  asunto?: string;
  comentario?: string;
}

const data: N[] = [
  {
    id: 1,
    tipo: "advertencia",
    titulo: "Notificación del asesor",
    mensaje:
      "Tu asesor académico te ha enviado una observación sobre tus horas concluidas.",
    fecha: "04 jun 2026, 12:20",
    leida: false,
    remitente: "Asesor académico",
    asunto: "Pocas horas concluidas",
    comentario:
      "Se detectó que llevas pocas horas registradas en comparación con el avance esperado del periodo. Te recomiendo actualizar tu registro de horas y verificar con la empresa que tus actividades estén siendo reportadas correctamente.",
  },
  {
    id: 2,
    tipo: "rechazado",
    titulo: "Documento rechazado",
    mensaje:
      "Tu carta de aceptación fue rechazada. Motivo: Nombre de archivo incorrecto.",
    fecha: "03 jun 2026, 09:15",
    leida: false,
    asunto: "Carta de aceptación rechazada",
    comentario:
      "El formato correcto es: carta_aceptacion_MATRICULA.pdf. Corrige el nombre del archivo y vuelve a subirlo.",
  },
  {
    id: 3,
    tipo: "advertencia",
    titulo: "Archivo ilegible",
    mensaje:
      "El reporte parcial enviado el 01 de junio no puede ser procesado debido a baja calidad de imagen.",
    fecha: "02 jun 2026, 14:30",
    leida: false,
    asunto: "Archivo ilegible",
    comentario:
      "Por favor sube una versión en alta resolución para que pueda ser revisada correctamente.",
  },
  {
    id: 4,
    tipo: "aprobado",
    titulo: "Documento aprobado",
    mensaje:
      "Tu carta de presentación ha sido revisada y aprobada por el Coordinador de Prácticas.",
    fecha: "01 jun 2026, 11:00",
    leida: false,
    asunto: "Carta de presentación aprobada",
    comentario:
      "El documento cumple con los requisitos establecidos y queda validado dentro del sistema.",
  },
  {
    id: 5,
    tipo: "info",
    titulo: "Nombre de archivo incorrecto",
    mensaje:
      "El plan de trabajo fue cargado con un nombre incorrecto.",
    fecha: "31 may 2026, 08:45",
    leida: true,
    asunto: "Corrección de nombre de archivo",
    comentario:
      "Por favor renómbralo como plan_trabajo_MATRICULA.pdf y vuelve a cargarlo en la plataforma.",
  },
  {
    id: 6,
    tipo: "aprobado",
    titulo: "Vigencia de derechos validada",
    mensaje:
      "Tu vigencia de derechos escolares ha sido verificada automáticamente.",
    fecha: "28 may 2026, 10:00",
    leida: true,
    asunto: "Vigencia validada",
    comentario:
      "Estado: Vigente para el periodo Feb–Jul 2026.",
  },
  {
    id: 7,
    tipo: "info",
    titulo: "Aviso institucional: Jornada de inducción",
    mensaje:
      "Te invitamos a la jornada de inducción el día 10 de junio 2026.",
    fecha: "25 may 2026, 09:00",
    leida: true,
    asunto: "Jornada de inducción",
    comentario:
      "La jornada será el día 10 de junio 2026 a las 10:00 hrs en el Auditorio Principal.",
  },
];

const tipoCfg: Record<NT, { icon: any; color: string; bg: string }> = {
  aprobado: {
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50",
  },
  rechazado: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
  },
  advertencia: {
    icon: AlertTriangle,
    color: "text-yellow-600",
    bg: "bg-yellow-50",
  },
  info: {
    icon: Info,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
};

export function AlumnoNotificaciones() {
  const [notifs, setNotifs] = useState<N[]>(data);
  const [filtro, setFiltro] = useState<"todas" | "no_leidas">("todas");
  const [notificacionSeleccionada, setNotificacionSeleccionada] =
    useState<N | null>(null);

  const noLeidas = notifs.filter((n) => !n.leida).length;

  const filtradas =
    filtro === "no_leidas" ? notifs.filter((n) => !n.leida) : notifs;

  const marcarComoLeida = (id: number) => {
    setNotifs((p) =>
      p.map((n) => (n.id === id ? { ...n, leida: true } : n))
    );
  };

  const abrirDetalle = (n: N) => {
    setNotificacionSeleccionada(n);
    marcarComoLeida(n.id);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">
            Notificaciones
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Avisos del coordinador, asesor académico y del sistema
          </p>
        </div>

        {noLeidas > 0 && (
          <button
            onClick={() =>
              setNotifs((p) => p.map((n) => ({ ...n, leida: true })))
            }
            className="flex items-center gap-2 text-sm text-[#1565c0] hover:underline"
          >
            <Check className="w-4 h-4" />
            Marcar todas como leídas
          </button>
        )}
      </div>

      <div className="flex gap-3">
        {[
          { k: "todas", l: "Todas" },
          { k: "no_leidas", l: `No leídas (${noLeidas})` },
        ].map((f) => (
          <button
            key={f.k}
            onClick={() => setFiltro(f.k as "todas" | "no_leidas")}
            className={`px-5 py-2 rounded-xl text-sm font-semibold transition-colors ${
              filtro === f.k
                ? "bg-[#0d2b5e] text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f.l}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtradas.map((n) => {
          const c = tipoCfg[n.tipo];
          const Icon = c.icon;

          return (
            <div
              key={n.id}
              className={`bg-white rounded-2xl border shadow-sm p-5 flex gap-4 ${
                !n.leida
                  ? "border-l-4 border-l-[#1565c0] border-gray-200"
                  : "border-gray-200"
              }`}
            >
              <div
                className={`w-10 h-10 ${c.bg} rounded-xl flex items-center justify-center flex-shrink-0`}
              >
                <Icon className={`w-5 h-5 ${c.color}`} />
              </div>

              <div className="flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div
                    className={`font-semibold text-gray-800 text-sm ${
                      !n.leida ? "text-[#0d2b5e]" : ""
                    }`}
                  >
                    {n.titulo}
                  </div>

                  {!n.leida && (
                    <span className="bg-[#1565c0] w-2 h-2 rounded-full flex-shrink-0 mt-1" />
                  )}
                </div>

                <div className="text-gray-600 text-xs mt-1 leading-relaxed">
                  {n.mensaje}
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-3">
                  <div className="text-xs text-gray-400 flex items-center gap-1.5">
                    <Bell className="w-3 h-3" />
                    {n.fecha}
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => abrirDetalle(n)}
                      className="text-xs text-[#1565c0] hover:underline flex items-center gap-1"
                    >
                      <Eye className="w-3 h-3" />
                      Ver detalle
                    </button>

                    {!n.leida && (
                      <button
                        onClick={() => marcarComoLeida(n.id)}
                        className="text-xs text-[#1565c0] hover:underline"
                      >
                        Marcar como leída
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {filtradas.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <div>
              No hay notificaciones
              {filtro === "no_leidas" ? " sin leer" : ""}
            </div>
          </div>
        )}
      </div>

      {notificacionSeleccionada && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-2xl p-6">
            <div className="flex items-start justify-between gap-4 border-b border-gray-200 pb-4">
              <div>
                <h2 className="text-xl font-bold text-[#0d2b5e]">
                  Detalle de notificación
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Información completa del aviso recibido
                </p>
              </div>

              <button
                onClick={() => setNotificacionSeleccionada(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="mt-5 space-y-5">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <div className="text-xs text-gray-400 mb-1">Título</div>
                <div className="font-bold text-[#0d2b5e]">
                  {notificacionSeleccionada.titulo}
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Fecha</div>
                  <div className="text-sm font-semibold text-gray-700">
                    {notificacionSeleccionada.fecha}
                  </div>
                </div>

                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                  <div className="text-xs text-gray-400 mb-1">Remitente</div>
                  <div className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                    <UserRound className="w-4 h-4 text-[#1565c0]" />
                    {notificacionSeleccionada.remitente || "Sistema"}
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-5">
                <div className="text-xs text-blue-500 font-semibold mb-2">
                  Asunto
                </div>
                <div className="text-lg font-bold text-[#0d2b5e]">
                  {notificacionSeleccionada.asunto || "Sin asunto"}
                </div>
              </div>

              <div className="bg-white border border-gray-200 rounded-2xl p-5">
                <div className="flex items-center gap-2 text-sm font-bold text-[#0d2b5e] mb-3">
                  <MessageSquare className="w-5 h-5 text-[#1565c0]" />
                  Comentario
                </div>

                <p className="text-sm text-gray-600 leading-relaxed">
                  {notificacionSeleccionada.comentario ||
                    notificacionSeleccionada.mensaje}
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => setNotificacionSeleccionada(null)}
                  className="bg-[#0d2b5e] text-white rounded-xl px-5 py-2 text-sm font-semibold"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}