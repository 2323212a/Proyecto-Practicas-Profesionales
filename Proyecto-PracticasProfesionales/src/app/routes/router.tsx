import { createBrowserRouter } from "react-router";

import { LoginPage } from "../pages/auth/LoginPage";
import { AlumnoDashboard } from "../pages/alumno/AlumnoDashboard";
import { CoordinadorDashboard } from "../pages/coordinador/CoordinadorDashboard";
import { CoordUnidadesDashboard } from "../pages/coord-unidades/CoordUnidadesDashboard";
import { DashboardDireccion } from "../pages/direccion/DashboardDireccion";
import { UnidadDashboard } from "../pages/unidad/UnidadDashboard";
import { DashboardAdmin } from "../pages/admin/DashboardAdmin";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <LoginPage />,
  },
  {
    path: "/alumno",
    element: <AlumnoDashboard />,
  },
  {
    path: "/coordinador",
    element: <CoordinadorDashboard />,
  },
  {
    path: "/coord-unidades",
    element: <CoordUnidadesDashboard />,
  },
  {
    path: "/direccion",
    element: <DashboardDireccion />,
  },
  {
    path: "/unidad",
    element: <UnidadDashboard />,
  },
  {
    path: "/admin",
    element: <DashboardAdmin />,
  },
]);