import { Navigate, Outlet } from "react-router";

interface ProtectedRouteProps {
  allowedRoles?: number[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const token = localStorage.getItem("token");
  const usuarioGuardado = localStorage.getItem("usuario");

  if (!token || !usuarioGuardado) {
    return <Navigate to="/login" replace />;
  }

  let usuario;
  try {
    usuario = JSON.parse(usuarioGuardado);
  } catch {
    localStorage.removeItem("token");
    localStorage.removeItem("usuario");
    return <Navigate to="/login" replace />;
  }

  if (
    allowedRoles &&
    !allowedRoles.includes(usuario.id_rol)
  ) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
