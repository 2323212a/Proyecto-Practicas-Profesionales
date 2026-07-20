import { NotificacionesUsuarioView } from "../../components/NotificacionesUsuarioView";

export function NotificacionesCoordUnidades() {
  return (
    <NotificacionesUsuarioView
      titulo="Notificaciones"
      subtitulo="Alertas relacionadas con empresas, formatos, documentos y padron de unidades receptoras."
      ayudaContextual="Revisa aqui eventos del modulo: altas de empresa, revisiones documentales, convenios y cambios de vacantes. Prioriza primero alertas de rechazo o pendientes."
    />
  );
}
