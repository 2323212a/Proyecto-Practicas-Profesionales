import { useEffect, useRef, useState } from "react";
import { Bell, Check, Clock, X } from "lucide-react";
import { useNavigate } from "react-router";

import { gestionNotificacionesUseCase } from "../dependencies";
import type { Notificacion } from "../../domain/notificaciones/Notificacion";

type Props = {
  idUsuario: number;
  rutaBandeja: string;
};

function fechaCorta(value: string) {
  const fecha = new Date(value);
  if (Number.isNaN(fecha.getTime())) return value;
  return fecha.toLocaleString("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function HeaderNotifications({ idUsuario, rutaBandeja }: Props) {
  const navigate = useNavigate();
  const contenedor = useRef<HTMLDivElement>(null);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);

  async function cargar() {
    try {
      setCargando(true);
      setNotificaciones(await gestionNotificacionesUseCase.listarPorUsuario(idUsuario));
    } catch (error) {
      console.error("No se pudieron cargar las notificaciones del encabezado.", error);
    } finally {
      setCargando(false);
    }
  }

  useEffect(() => {
    void cargar();
  }, [idUsuario]); // eslint-disable-line react-hooks/exhaustive-deps -- cargar usa el usuario actual.

  useEffect(() => {
    const actualizar = () => void cargar();
    window.addEventListener("notificaciones-actualizadas", actualizar);
    return () => window.removeEventListener("notificaciones-actualizadas", actualizar);
  }, [idUsuario]); // eslint-disable-line react-hooks/exhaustive-deps -- recarga el usuario actual.

  useEffect(() => {
    if (!abierto) return;
    function cerrarFuera(event: MouseEvent) {
      if (contenedor.current && !contenedor.current.contains(event.target as Node)) {
        setAbierto(false);
      }
    }
    document.addEventListener("mousedown", cerrarFuera);
    return () => document.removeEventListener("mousedown", cerrarFuera);
  }, [abierto]);

  const noLeidas = notificaciones.filter((item) => !item.leida).length;
  const recientes = notificaciones.slice(0, 6);

  async function abrirNotificacion(notificacion: Notificacion) {
    if (!notificacion.leida) {
      setNotificaciones((actuales) =>
        actuales.map((item) =>
          item.id_notificacion === notificacion.id_notificacion ? { ...item, leida: true } : item,
        ),
      );
      try {
        await gestionNotificacionesUseCase.marcarLeida(notificacion.id_notificacion);
      } catch (error) {
        console.error("No se pudo marcar la notificacion como leida.", error);
        void cargar();
      }
    }
  }

  async function marcarTodas() {
    setNotificaciones((actuales) => actuales.map((item) => ({ ...item, leida: true })));
    try {
      await gestionNotificacionesUseCase.marcarTodas(idUsuario);
    } catch (error) {
      console.error("No se pudieron marcar las notificaciones.", error);
      void cargar();
    }
  }

  return (
    <div ref={contenedor} className="relative">
      <button
        type="button"
        onClick={() => setAbierto((valor) => !valor)}
        className="relative rounded-xl p-1.5 text-gray-500 transition-colors hover:bg-blue-50 hover:text-[#1565c0]"
        aria-label="Abrir notificaciones"
        aria-expanded={abierto}
      >
        <Bell className="h-4 w-4" />
        {noLeidas > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold leading-none text-white">
            {noLeidas > 99 ? "99+" : noLeidas}
          </span>
        )}
      </button>

      {abierto && (
        <div className="fixed inset-x-3 top-14 z-50 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-10 sm:w-96">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
            <div>
              <p className="font-bold text-[#0d2b5e]">Notificaciones</p>
              <p className="text-xs text-gray-400">{noLeidas} sin leer</p>
            </div>
            <div className="flex items-center gap-2">
              {noLeidas > 0 && (
                <button type="button" onClick={marcarTodas} className="flex items-center gap-1 text-xs font-semibold text-[#1565c0] hover:underline">
                  <Check className="h-3.5 w-3.5" /> Todas leidas
                </button>
              )}
              <button type="button" onClick={() => setAbierto(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100" aria-label="Cerrar lista">
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          <div className="max-h-[420px] divide-y divide-gray-100 overflow-y-auto">
            {cargando && <div className="p-8 text-center text-sm text-gray-400">Cargando notificaciones...</div>}
            {!cargando && recientes.map((notificacion) => (
              <button
                type="button"
                key={notificacion.id_notificacion}
                onClick={() => void abrirNotificacion(notificacion)}
                className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${!notificacion.leida ? "border-l-4 border-l-[#1565c0]" : ""}`}
              >
                <div className="flex items-start gap-3">
                  <Bell className={`mt-0.5 h-4 w-4 flex-shrink-0 ${notificacion.leida ? "text-gray-400" : "text-[#1565c0]"}`} />
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm ${notificacion.leida ? "font-medium text-gray-700" : "font-bold text-[#0d2b5e]"}`}>{notificacion.titulo}</p>
                    <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-gray-500">{notificacion.mensaje}</p>
                    <p className="mt-2 flex items-center gap-1 text-[10px] text-gray-400"><Clock className="h-3 w-3" />{fechaCorta(notificacion.fecha_envio)}</p>
                  </div>
                  {!notificacion.leida && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#1565c0]" />}
                </div>
              </button>
            ))}
            {!cargando && recientes.length === 0 && (
              <div className="p-10 text-center text-sm text-gray-400">No tienes notificaciones.</div>
            )}
          </div>

          <button
            type="button"
            onClick={() => { setAbierto(false); navigate(rutaBandeja); }}
            className="w-full border-t border-gray-100 px-4 py-3 text-sm font-bold text-[#1565c0] hover:bg-blue-50"
          >
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  );
}
