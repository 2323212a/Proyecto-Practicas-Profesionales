import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, Bell, Check, CheckCircle, Clock3, Info, X, XCircle } from "lucide-react";
import { useNavigate } from "react-router";

import type { Notificacion } from "../../domain/notificaciones/Notificacion";
import { gestionNotificacionesUseCase } from "../dependencies";

type Props = { role: string; idUsuario?: number };
const RUTAS: Record<string, string> = {
  alumno: "/alumno/notificaciones",
  coordinador: "/coordinador/notificaciones",
  "coord-unidades": "/coord-unidades/notificaciones",
  asesor: "/asesor/notificaciones",
};
const EVENTO = "notificaciones:actualizadas";
const AVISAR_AL_INICIAR = "notificaciones:mostrar-al-iniciar";

function fechaRelativa(fecha: string) {
  const valor = new Date(fecha);
  if (Number.isNaN(valor.getTime())) return "";
  const segundos = Math.max(0, Math.floor((Date.now() - valor.getTime()) / 1000));
  if (segundos < 60) return "Ahora";
  const minutos = Math.floor(segundos / 60);
  if (minutos < 60) return "Hace " + minutos + " min";
  const horas = Math.floor(minutos / 60);
  if (horas < 24) return "Hace " + horas + " h";
  const dias = Math.floor(horas / 24);
  return dias < 7 ? "Hace " + dias + " d" : valor.toLocaleDateString("es-MX", { day: "2-digit", month: "short" });
}

function visualDe(notificacion: Notificacion) {
  const texto = (notificacion.titulo + " " + notificacion.mensaje).toLowerCase();
  if (texto.includes("rechaz") || texto.includes("incidencia")) return { Icono: XCircle, color: "text-red-600", fondo: "bg-red-50", borde: "border-red-200" };
  if (texto.includes("aprob") || texto.includes("liberacion") || texto.includes("emitida")) return { Icono: CheckCircle, color: "text-emerald-600", fondo: "bg-emerald-50", borde: "border-emerald-200" };
  if (texto.includes("observ") || texto.includes("pendiente") || texto.includes("revision")) return { Icono: AlertTriangle, color: "text-amber-600", fondo: "bg-amber-50", borde: "border-amber-200" };
  return { Icono: Info, color: "text-blue-600", fondo: "bg-blue-50", borde: "border-blue-200" };
}

export function NotificationCenter({ role, idUsuario }: Props) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [avisos, setAvisos] = useState<Notificacion[]>([]);
  const [abierto, setAbierto] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const ruta = RUTAS[role] ?? null;

  const cargar = useCallback(async () => {
    if (!idUsuario || !ruta) return [] as Notificacion[];
    try {
      setCargando(true);
      setError("");
      const items = await gestionNotificacionesUseCase.listarPorUsuario(idUsuario);
      setNotificaciones(items);
      return items;
    } catch (err) {
      console.error(err);
      setError("No se pudieron cargar las notificaciones.");
      return [] as Notificacion[];
    } finally {
      setCargando(false);
    }
  }, [idUsuario, ruta]);

  useEffect(() => {
    if (!idUsuario || !ruta) return;
    let activo = true;
    let temporizador: ReturnType<typeof setTimeout> | undefined;
    void cargar().then((items) => {
      if (!activo || sessionStorage.getItem(AVISAR_AL_INICIAR) !== String(idUsuario)) return;
      setAvisos(items.filter((item) => !item.leida).slice(0, 3));
      sessionStorage.removeItem(AVISAR_AL_INICIAR);
      temporizador = setTimeout(() => { if (activo) setAvisos([]); }, 6000);
    });
    const intervalo = window.setInterval(() => void cargar(), 60_000);
    const refrescar = () => void cargar();
    window.addEventListener(EVENTO, refrescar);
    return () => {
      activo = false;
      window.clearInterval(intervalo);
      if (temporizador) clearTimeout(temporizador);
      window.removeEventListener(EVENTO, refrescar);
    };
  }, [cargar, idUsuario, ruta]);

  useEffect(() => {
    if (!abierto) return;
    const cerrarFuera = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) setAbierto(false);
    };
    const cerrarEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setAbierto(false); };
    document.addEventListener("mousedown", cerrarFuera);
    document.addEventListener("keydown", cerrarEscape);
    return () => {
      document.removeEventListener("mousedown", cerrarFuera);
      document.removeEventListener("keydown", cerrarEscape);
    };
  }, [abierto]);

  if (!ruta) return null;
  const noLeidas = notificaciones.filter((item) => !item.leida).length;

  async function abrir(notificacion: Notificacion) {
    setAbierto(false);
    setAvisos((items) => items.filter((item) => item.id_notificacion !== notificacion.id_notificacion));
    if (!notificacion.leida) {
      setNotificaciones((items) => items.map((item) => item.id_notificacion === notificacion.id_notificacion ? { ...item, leida: true } : item));
      try { await gestionNotificacionesUseCase.marcarLeida(notificacion.id_notificacion); }
      catch (err) { console.error(err); void cargar(); }
    }
    navigate(ruta);
  }

  async function marcarTodas() {
    if (!idUsuario) return;
    setNotificaciones((items) => items.map((item) => ({ ...item, leida: true })));
    setAvisos([]);
    try { await gestionNotificacionesUseCase.marcarTodas(idUsuario); }
    catch (err) { console.error(err); void cargar(); }
  }

  return (
    <>
      <div ref={panelRef} className="relative">
        <button type="button" aria-label={"Notificaciones" + (noLeidas ? ", " + noLeidas + " sin leer" : "")} aria-expanded={abierto}
          onClick={() => { setAbierto((valor) => !valor); if (!abierto) void cargar(); }}
          className={"relative rounded-xl p-2 transition-colors " + (abierto ? "bg-blue-50 text-[#1565c0]" : "text-gray-500 hover:bg-blue-50 hover:text-[#1565c0]")}>
          <Bell className="h-5 w-5" />
          {noLeidas > 0 && <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold leading-none text-white ring-2 ring-white">{noLeidas > 99 ? "99+" : noLeidas}</span>}
        </button>

        {abierto && (
          <div className="absolute right-0 top-[calc(100%+0.65rem)] z-50 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
            <div className="flex items-start justify-between gap-3 border-b border-gray-100 px-4 py-3">
              <div><h2 className="text-sm font-bold text-[#0d2b5e]">Notificaciones</h2><p className="mt-0.5 text-xs text-gray-500">{noLeidas ? noLeidas + " sin leer" : "Todo está al día"}</p></div>
              <div className="flex items-center gap-2">
                {noLeidas > 0 && <button type="button" onClick={() => void marcarTodas()} className="flex items-center gap-1 text-[11px] font-semibold text-[#1565c0] hover:underline"><Check className="h-3.5 w-3.5" /> Marcar todas</button>}
                <button type="button" aria-label="Cerrar panel" onClick={() => setAbierto(false)} className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X className="h-4 w-4" /></button>
              </div>
            </div>
            <div className="max-h-[min(28rem,65vh)] overflow-y-auto">
              {cargando && notificaciones.length === 0 && <div className="px-5 py-10 text-center text-sm text-gray-400">Cargando notificaciones...</div>}
              {!cargando && error && notificaciones.length === 0 && <div className="px-5 py-8 text-center text-sm text-orange-600">{error}</div>}
              {!cargando && !error && notificaciones.length === 0 && <div className="px-5 py-10 text-center"><Bell className="mx-auto mb-2 h-9 w-9 text-gray-200" /><p className="text-sm text-gray-500">No tienes notificaciones.</p></div>}
              {notificaciones.slice(0, 5).map((notificacion) => {
                const { Icono, color, fondo } = visualDe(notificacion);
                return <button type="button" key={notificacion.id_notificacion} onClick={() => void abrir(notificacion)} className={"flex w-full gap-3 border-b border-gray-100 px-4 py-3 text-left transition-colors last:border-b-0 hover:bg-gray-50 " + (!notificacion.leida ? "bg-blue-50/50" : "bg-white")}>
                  <span className={"mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl " + fondo}><Icono className={"h-5 w-5 " + color} /></span>
                  <span className="min-w-0 flex-1"><span className="flex items-start gap-2"><span className={"line-clamp-1 flex-1 text-xs " + (!notificacion.leida ? "font-bold text-[#0d2b5e]" : "font-semibold text-gray-700")}>{notificacion.titulo}</span>{!notificacion.leida && <span className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-[#1565c0]" />}</span><span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-gray-500">{notificacion.mensaje}</span><span className="mt-1.5 flex items-center gap-1 text-[10px] text-gray-400"><Clock3 className="h-3 w-3" />{fechaRelativa(notificacion.fecha_envio)}</span></span>
                </button>;
              })}
            </div>
            <button type="button" onClick={() => { setAbierto(false); navigate(ruta); }} className="w-full border-t border-gray-100 bg-gray-50 px-4 py-3 text-xs font-bold text-[#1565c0] hover:bg-blue-50">Ver todas las notificaciones</button>
          </div>
        )}
      </div>

      {avisos.length > 0 && <div aria-live="polite" className="fixed right-4 top-20 z-[60] flex w-[min(24rem,calc(100vw-2rem))] flex-col gap-3">
        {avisos.map((notificacion) => {
          const { Icono, color, fondo, borde } = visualDe(notificacion);
          return <div key={notificacion.id_notificacion} className={"relative overflow-hidden rounded-2xl border bg-white shadow-xl " + borde}>
            <button type="button" onClick={() => void abrir(notificacion)} className="flex w-full gap-3 p-4 pr-11 text-left hover:bg-gray-50"><span className={"flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl " + fondo}><Icono className={"h-5 w-5 " + color} /></span><span className="min-w-0"><span className="block text-[11px] font-bold uppercase tracking-wide text-[#1565c0]">Nueva notificación</span><span className="mt-0.5 line-clamp-1 block text-sm font-bold text-[#0d2b5e]">{notificacion.titulo}</span><span className="mt-1 line-clamp-2 block text-xs leading-relaxed text-gray-600">{notificacion.mensaje}</span></span></button>
            <button type="button" aria-label="Cerrar notificación" onClick={() => setAvisos((items) => items.filter((item) => item.id_notificacion !== notificacion.id_notificacion))} className="absolute right-2.5 top-2.5 rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"><X className="h-4 w-4" /></button>
          </div>;
        })}
      </div>}
    </>
  );
}
