import { createBrowserRouter } from "react-router";

import { LandingPage } from "../pages/landing/LandingPage";
import { LoginPage } from "../pages/auth/LoginPage";
import { RegisterPage } from "../pages/auth/RegisterPage";
import { MainLayout } from "../layouts/MainLayout";

// Alumno
import { AlumnoDashboard } from "../pages/alumno/AlumnoDashboard";
import { AlumnoPerfil } from "../pages/alumno/AlumnoPerfil";
import { ValidacionMaterias } from "../pages/alumno/ValidacionMaterias";
import { VigenciaDerechos } from "../pages/alumno/VigenciaDerechos";
import { PadronEmpresarial } from "../pages/alumno/PadronEmpresarial";
import { HorasAcumuladas } from "../pages/alumno/HorasAcumuladas";
import { EvaluacionEmpresa } from "../pages/alumno/EvaluacionEmpresa";
import { AlumnoNotificaciones } from "../pages/alumno/AlumnoNotificaciones";
import { CargaDocumentos } from "../pages/alumno/CargaDocumentos";
import { AlumnoReportes } from "../pages/alumno/AlumnoReportes";

// Otras páginas para admin, coordinador, etc. se agregarían aquí



export const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/registro",
    element: <RegisterPage />,
  },

{
  path: "/alumno",
  element: <MainLayout />,
  children: [
    {
      index: true,
      element: <AlumnoDashboard />,
    },
    {
      path: "perfil",
      element: <AlumnoPerfil />,
    },
    {
      path: "materias",
      element: <ValidacionMaterias />,
    },
    {
      path: "vigencia",
      element: <VigenciaDerechos />,
    },
    {
      path: "documentos",
      element: <CargaDocumentos />,
    },
    {
      path: "padron",
      element: <PadronEmpresarial />,
    },
    {
      path: "horas",
      element: <HorasAcumuladas />,
    },
    {
      path: "evaluacion",
      element: <EvaluacionEmpresa />,
    },
    {
      path: "notificaciones",
      element: <AlumnoNotificaciones />,
    },
    {
      path: "reportes",
      element: <AlumnoReportes />,
    },
  ],
},
  // Otras rutas para admin, coordinador, etc. se agregarían aquí
] );