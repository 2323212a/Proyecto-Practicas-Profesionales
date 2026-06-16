import { useState } from "react";
import {
  CheckCircle,
} from "lucide-react";
import { Outlet, useNavigate, useLocation } from "react-router";
import {
  GraduationCap,
  LayoutDashboard,
  BookOpen,
  Shield,
  FileText,
  Clock,
  Bell,
  User,
  ChevronRight,
  Building2,
  Users,
  FileCheck,
  BarChart3,
  Settings,
  Clock3,
  Briefcase,
  Home,
  ClipboardList,
  LogOut,
  Menu,
  ChevronLeft,
  ChevronDown,
  Star,
  MessageSquare,
} from "lucide-react";
import unachlogo from "../../assets/unachlogo1.jpg";
type NavItem = {
  label: string;
  icon: any;
  path: string;
  badge?: number;
};

function getNav(role: string): NavItem[] {
if (role === "alumno")
  return [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/alumno",
    },
    {
      label: "Documentación",
      icon: FileText,
      path: "/alumno/documentos",
    },
    {
      label: "Padrón Empresarial",
      icon: Building2,
      path: "/alumno/padron",
    },
    {
      label: "Mis Reportes",
      icon: ClipboardList,
      path: "/alumno/reportes",
    },
    {
      label: "Horas Acumuladas",
      icon: Clock3,
      path: "/alumno/horas",
    },
    {
      label: "Evaluación Empresa",
      icon: Star,
      path: "/alumno/evaluacion",
    },
    {
      label: "Notificaciones",
      icon: Bell,
      path: "/alumno/notificaciones",
    },
    {
      label: "Perfil",
      icon: User,
      path: "/alumno/perfil",
    },
  ];
 if (role === "coordinador")
  return [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/coordinador",
    },
    {
      label: "Gestión de Alumnos",
      icon: Users,
      path: "/coordinador/alumnos",
    },
    {
      label: "Revisión de Documentos",
      icon: FileCheck,
      path: "/coordinador/documentos",
    },
    {
      label: "Asignaciones",
      icon: ClipboardList,
      path: "/coordinador/asignaciones",
    },
    {
      label: "Seguimiento",
      icon: Clock,
      path: "/coordinador/seguimiento",
    },
    {
      label: "Liberación",
      icon: CheckCircle,
      path: "/coordinador/liberacion",
    },
    {
      label: "Notificaciones",
      icon: Bell,
      path: "/coordinador/notificaciones",
      badge: 5,
    },
  ];
  if (role === "unidad")
    return [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/unidad",
      },
      {
        label: "Perfil Empresa",
        icon: Building2,
        path: "/unidad/perfil",
      },
      {
        label: "Plan de trabajo",
        icon: Briefcase,
        path: "/unidad/ofertas",
      },
      {
        label: "Alumnos",
        icon: Users,
        path: "/unidad/alumnos",
      },
      {
        label: "Convenios",
        icon: FileText,
        path: "/unidad/convenios",
      },
      { label: "Horas", icon: Clock, path: "/unidad/horas" },
      {
        label: "Evaluaciones",
        icon: Star,
        path: "/unidad/evaluaciones",
      },
      {
        label: "Registro de Empresa",
        icon: ClipboardList,
        path: "/unidad/registro",
      },
    ];
  if (role === "coord-unidades")
  return [
    {
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/coord-unidades",
    },
    {
      label: "Empresas",
      icon: Building2,
      path: "/coord-unidades/empresas",
    },
    {
      label: "Convenios",
      icon: FileText,
      path: "/coord-unidades/convenios",
    },
    {
      label: "Vacantes",
      icon: Briefcase,
      path: "/coord-unidades/vacantes",
    },
    {
      label: "Padrón Empresarial",
      icon: ClipboardList,
      path: "/coord-unidades/padron",
    },
    {
      label: "Notificaciones",
      icon: Bell,
      path: "/coord-unidades/notificaciones",
    },
  ];
  if (role === "admin")
    return [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/admin",
      },
      {
        label: "Gestión de Usuarios",
        icon: Users,
        path: "/admin/usuarios",
      },
      {
        label: "Roles y Permisos",
        icon: Shield,
        path: "/admin/roles",
      },
      {
        label: "Catálogos",
        icon: ClipboardList,
        path: "/admin/catalogos",
      },
      {
        label: "Reportes",
        icon: BarChart3,
        path: "/admin/reportes",
      },
      {
        label: "Configuración",
        icon: Settings,
        path: "/admin/config",
      },
    ];
  if (role === "asesor")
    return [
      {
        label: "Dashboard",
        icon: LayoutDashboard,
        path: "/asesor",
      },
      {
        label: "Alumnos Asignados",
        icon: Users,
        path: "/asesor/alumnos",
      },
      {
        label: "Reportes",
        icon: BarChart3,
        path: "/asesor/reportes",
      },
      {
        label: "Observaciones",
        icon: MessageSquare,
        path: "/asesor/observaciones",
      },
    ];
  if (role === "direccion")
    return [
      {
        label: "Dashboard Ejecutivo",
        icon: LayoutDashboard,
        path: "/direccion",
      },
      {
        label: "Estadísticas",
        icon: BarChart3,
        path: "/direccion/estadisticas",
      },
      {
        label: "Reportes",
        icon: FileText,
        path: "/direccion/reportes",
      },
    ];
  return [];
}

function getRoleInfo(pathname: string) {
  if (pathname.startsWith("/alumno"))
    return {
      role: "alumno",
      label: "Alumno",
      name: "Brayan Madain",
      subtitle: "Ing. En desarrollo de software",
    };
  if (pathname.startsWith("/coordinador"))
    return {
      role: "coordinador",
      label: "Coordinador de Prácticas",
      name: "Dr. Roberto Méndez",
      subtitle: "Coordinación de Prácticas",
    };
  if (pathname.startsWith("/unidad"))
    return {
      role: "unidad",
      label: "Unidad Receptora",
      name: "TechSoft Chiapas S.A.",
      subtitle: "Empresa asociada",
    };
  if (pathname.startsWith("/coord-unidades"))
    return {
      role: "coord-unidades",
      label: "Coord. Unidades Receptoras",
      name: "Lic. Ana Torres",
      subtitle: "Unidades Receptoras",
    };
  if (pathname.startsWith("/admin"))
    return {
      role: "admin",
      label: "Administrador",
      name: "Admin Sistema",
      subtitle: "Administración General",
    };
  if (pathname.startsWith("/asesor"))
    return {
      role: "asesor",
      label: "Asesor Interno",
      name: "M.C. Pedro Ruiz",
      subtitle: "Asesoría Académica",
    };
  if (pathname.startsWith("/direccion"))
    return {
      role: "direccion",
      label: "Dirección",
      name: "Dirección General",
      subtitle: "Solo Lectura",
    };
  return {
    role: "alumno",
    label: "Alumno",
    name: "Usuario",
    subtitle: "",
  };
}

export function MainLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const { role, label, name, subtitle } = getRoleInfo(
    location.pathname,
  );
  const navItems = getNav(role);
  const breadcrumb =
    navItems.find((n) => n.path === location.pathname)?.label ||
    "Inicio";
  const notifCount = navItems.reduce(
    (a, n) => a + (n.badge || 0),
    0,
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 left-0 h-full bg-[#0d2b5e] z-30 flex flex-col transition-all duration-300 ${collapsed ? "w-16" : "w-64"} ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        <div
          className={`flex items-center gap-3 px-4 py-5 border-b border-white/10 ${collapsed ? "justify-center" : ""}`}
        >
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden">
  <img
    src={unachlogo}
    alt="UNACH"
    className="w-full h-full object-contain"
  />
</div>
          {!collapsed && (
            <div>
              <div className="text-white font-bold text-sm">
                UNACH
              </div>
              <div className="text-blue-300 text-xs">
                Prácticas Profesionales
              </div>
            </div>
          )}
        </div>

        {!collapsed && (
          <div className="px-4 py-3 border-b border-white/10">
            <div className="bg-white/10 rounded-xl px-3 py-2">
              <div className="text-white font-semibold text-xs">
                {name}
              </div>
              <div className="text-blue-300 text-xs mt-0.5">
                {label}
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMobileOpen(false);
                }}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors group relative ${active ? "bg-white/20 text-white" : "text-blue-200 hover:bg-white/10 hover:text-white"} ${collapsed ? "justify-center" : ""}`}
              >
                {active && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-white rounded-r-full" />
                )}
                <item.icon
                  className={`w-5 h-5 flex-shrink-0 ${active ? "text-white" : "text-blue-300 group-hover:text-white"}`}
                />
                {!collapsed && (
                  <>
                    <span className="text-sm font-medium">
                      {item.label}
                    </span>
                    {item.badge && (
                      <span className="ml-auto bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
                {collapsed && item.badge && (
                  <span className="absolute top-2 right-2 bg-red-500 w-2 h-2 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3 space-y-1">
          <button
            onClick={() => navigate("/")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-blue-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <Home className="w-4 h-4 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm">Inicio</span>
            )}
          </button>
          <button
            onClick={() => navigate("/login")}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-blue-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && (
              <span className="text-sm">Cerrar Sesión</span>
            )}
          </button>
          <button
            onClick={() => setCollapsed(!collapsed)}
            className={`hidden lg:flex w-full items-center gap-3 px-3 py-2.5 text-blue-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors ${collapsed ? "justify-center" : ""}`}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <>
                <ChevronLeft className="w-4 h-4" />
                <span className="text-sm">Colapsar</span>
              </>
            )}
          </button>
        </div>
      </aside>

      <div
        className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}
      >
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center gap-4 sticky top-0 z-10 shadow-sm">
          <button
            className="lg:hidden text-gray-500"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-2 text-sm text-gray-500 flex-1">
            <span className="text-[#1565c0] font-semibold">
              {label}
            </span>
            <ChevronDown className="w-3 h-3 -rotate-90" />
            <span className="text-gray-700 font-medium">
              {breadcrumb}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button className="relative p-2 text-gray-500 hover:text-[#1565c0] hover:bg-blue-50 rounded-xl transition-colors">
              <Bell className="w-5 h-5" />
              {notifCount > 0 && (
                <span className="absolute top-1 right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
                  {notifCount}
                </span>
              )}
            </button>
            <div className="flex items-center gap-3 pl-3 border-l border-gray-200">
              <div className="w-9 h-9 bg-[#0d2b5e] rounded-xl flex items-center justify-center">
                <User className="w-5 h-5 text-white" />
              </div>
              <div className="hidden md:block">
                <div className="text-sm font-semibold text-gray-800">
                  {name}
                </div>
                <div className="text-xs text-gray-400">
                  {subtitle}
                </div>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}