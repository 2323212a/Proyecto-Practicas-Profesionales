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
// Coordinador
import { CoordinadorDashboard } from "../pages/coordinador/CoordinadorDashboard";
import { GestionAlumnos } from "../pages/coordinador/GestionAlumnos";
import { RevisionDocumentos } from "../pages/coordinador/RevisionDocumentos";
import { CoordinadorAsignaciones } from "../pages/coordinador/CoordinadorAsignaciones";
import { CoordinadorSeguimiento } from "../pages/coordinador/CoordinadorSeguimiento";
import { CoordinadorLiberacion } from "../pages/coordinador/CoordinadorLiberacion";
import { CoordinadorNotificaciones } from "../pages/coordinador/CoordinadorNotificaciones";

// Unidad
import { UnidadDashboard } from "../pages/unidad/UnidadDashboard";
import { RegistroEmpresa } from "../pages/unidad/RegistroEmpresa";
import { PerfilEmpresa } from "../pages/unidad/PerfilEmpresa";
import { PlanTrabajo } from "../pages/unidad/PlanTrabajo";
import { AlumnosUnidad } from "../pages/unidad/AlumnosUnidad";
import { ConveniosUnidad } from "../pages/unidad/ConveniosUnidad";
import { HorasUnidad } from "../pages/unidad/HorasUnidad";
import { EvaluacionesUnidad } from "../pages/unidad/EvaluacionesUnidad";

// Coord. Unidades
import { CoordUnidadesDashboard } from "../pages/coord-unidades/CoordUnidadesDashboard";
import { ValidacionEmpresas } from "../pages/coord-unidades/ValidacionEmpresas";
import { GestionConvenios } from "../pages/coord-unidades/GestionConvenios";
import { ExpedienteEmpresa } from "../pages/coord-unidades/ExpedienteEmpresa";
import { GestionVacantes } from "../pages/coord-unidades/GestionVacantes";
import { PadronEmpresarial as PadronEmpresarialCoord } from "../pages/coord-unidades/PadronEmpresarial";
import { NotificacionesCoordUnidades } from "../pages/coord-unidades/NotificacionesCoordUnidades";

// Admin
import { AdminDashboard } from "../pages/admin/AdminDashboard";
import { GestionUsuarios } from "../pages/admin/GestionUsuarios";
import { AdminRolesPermisos } from "../pages/admin/AdminRolesPermisos";
import { AdminCatalogos } from "../pages/admin/AdminCatalogos";
import { AdminReportes } from "../pages/admin/AdminReportes";
import { AdminConfiguracion } from "../pages/admin/AdminConfiguracion";

// Asesor
import { AsesorDashboard } from "../pages/asesor/AsesorDashboard";
import { AlumnosAsignados } from "../pages/asesor/AlumnosAsignados";
import { AsesorReportes } from "../pages/asesor/AsesorReportes";
import { AsesorObservaciones } from "../pages/asesor/AsesorObservaciones";

// Dirección
import { DireccionDashboard } from "../pages/direccion/DireccionDashboard";
import { DireccionEstadisticas } from "../pages/direccion/DireccionEstadisticas";
import { DireccionReportes } from "../pages/direccion/DireccionReportes";


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
// Coordinador
{
  path: "/coordinador",
  element: <MainLayout />,
  children: [
    { index: true, element: <CoordinadorDashboard /> },
    { path: "alumnos", element: <GestionAlumnos /> },
    { path: "documentos", element: <RevisionDocumentos /> },
    { path: "asignaciones", element: <CoordinadorAsignaciones /> },
    { path: "seguimiento", element: <CoordinadorSeguimiento /> },
    { path: "liberacion", element: <CoordinadorLiberacion /> },
    { path: "notificaciones", element: <CoordinadorNotificaciones /> },
  ],
},

// Unidad Receptora
{
  path: "/unidad",
  element: <MainLayout />,
  children: [
    { index: true, element: <UnidadDashboard /> },
    { path: "registro", element: <RegistroEmpresa /> },
    { path: "perfil", element: <PerfilEmpresa /> },
    { path: "ofertas", element: <PlanTrabajo /> },
    { path: "alumnos", element: <AlumnosUnidad /> },
    { path: "convenios", element: <ConveniosUnidad /> },
    { path: "horas", element: <HorasUnidad /> },
    { path: "evaluaciones", element: <EvaluacionesUnidad /> },
  ],
},

// Coordinador de Unidades
{
  path: "/coord-unidades",
  element: <MainLayout />,
  children: [
    { index: true, element: <CoordUnidadesDashboard /> },
    { path: "empresas", element: <ValidacionEmpresas /> },
    { path: "empresas/expediente", element: <ExpedienteEmpresa /> },
    { path: "convenios", element: <GestionConvenios /> },
    { path: "vacantes", element: <GestionVacantes /> },
    { path: "padron", element: <PadronEmpresarialCoord /> },
    { path: "notificaciones", element: <NotificacionesCoordUnidades /> },
  ],
},

// Administrador
{
  path: "/admin",
  element: <MainLayout />,
  children: [
    { index: true, element: <AdminDashboard /> },
    { path: "usuarios", element: <GestionUsuarios /> },
    { path: "roles", element: <AdminRolesPermisos /> },
    { path: "catalogos", element: <AdminCatalogos /> },
    { path: "reportes", element: <AdminReportes /> },
    { path: "configuracion", element: <AdminConfiguracion /> },
  ],
},

// Asesor
{
  path: "/asesor",
  element: <MainLayout />,
  children: [
    { index: true, element: <AsesorDashboard /> },
    { path: "alumnos", element: <AlumnosAsignados /> },
    { path: "reportes", element: <AsesorReportes /> },
    { path: "observaciones", element: <AsesorObservaciones /> },
  ],
},

// Dirección
{
  path: "/direccion",
  element: <MainLayout />,
  children: [
    { index: true, element: <DireccionDashboard /> },
    { path: "estadisticas", element: <DireccionEstadisticas /> },
    { path: "reportes", element: <DireccionReportes /> },
  ],
},
] );