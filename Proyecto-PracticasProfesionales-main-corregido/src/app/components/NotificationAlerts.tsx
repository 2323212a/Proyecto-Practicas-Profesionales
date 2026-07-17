import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";

import { gestionNotificacionesUseCase } from "../dependencies";
import type { Notificacion } from "../../domain/notificaciones/Notificacion";

type Props = {
  idUsuario: number;
};

export function NotificationAlerts({ idUsuario }: Props) {
  const [alertas, setAlertas] = useState<Notificacion[]>([]);

  useEffect(() => {
    let activo = true;
    const timers: number[] = [];

    async function cargarNuevas() {
      try {
        const notificaciones = await gestionNotificacionesUseCase.listarPorUsuario(idUsuario);
        if (!activo) return;

        const nuevas = notificaciones.filter((item) => !item.leida).slice(0, 5);
        setAlertas(nuevas);

        nuevas.forEach((notificacion) => {
          const timer = window.setTimeout(() => {
            setAlertas((actuales) =>
              actuales.filter((item) => item.id_notificacion !== notificacion.id_notificacion),
            );
          }, 6000);
          timers.push(timer);
        });
      } catch (error) {
        console.error("No se pudieron cargar las alertas del usuario.", error);
      }
    }

    void cargarNuevas();

    return () => {
      activo = false;
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [idUsuario]);

  useEffect(() => {
    const limpiar = () => setAlertas([]);
    window.addEventListener("notificaciones-actualizadas", limpiar);
    return () => window.removeEventListener("notificaciones-actualizadas", limpiar);
  }, []);

  function cerrar(idNotificacion: number) {
    setAlertas((actuales) =>
      actuales.filter((item) => item.id_notificacion !== idNotificacion),
    );
  }

  if (alertas.length === 0) return null;

  return (
    <div
      className="fixed right-4 top-20 z-50 flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3"
      role="region"
      aria-label="Notificaciones nuevas"
    >
      {alertas.map((notificacion) => (
        <div
          key={notificacion.id_notificacion}
          role="status"
          className="relative overflow-hidden rounded-2xl border border-blue-200 bg-white p-4 pr-11 shadow-xl"
        >
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600">
              <Bell className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-[#0d2b5e]">{notificacion.titulo}</p>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{notificacion.mensaje}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => cerrar(notificacion.id_notificacion)}
            className="absolute right-3 top-3 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
            aria-label="Cerrar notificacion"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="absolute inset-x-0 bottom-0 h-1 bg-[#1565c0]" />
        </div>
      ))}
    </div>
  );
}
