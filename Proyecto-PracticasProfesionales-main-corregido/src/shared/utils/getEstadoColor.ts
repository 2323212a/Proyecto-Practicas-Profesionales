export function getEstadoColor(estado: string) {
  switch (estado) {
    case "Aprobado":
      return "green";

    case "Pendiente":
      return "yellow";

    case "Rechazado":
      return "red";

    default:
      return "gray";
  }
}