import {
  Shield,
  Users,
  Edit,
  CheckCircle2,
} from "lucide-react";

const roles = [
  {
    rol: "Administrador",
    usuarios: 1,
    descripcion:
      "Administra usuarios, roles, catálogos y configuración general del sistema.",
    acceso: [
      "Gestión de Usuarios",
      "Roles y Permisos",
      "Catálogos",
      "Reportes",
      "Configuración",
    ],
  },
  {
    rol: "Coordinador de Prácticas",
    usuarios: 3,
    descripcion:
      "Gestiona alumnos, validaciones documentales y seguimiento de prácticas.",
    acceso: [
      "Dashboard",
      "Alumnos",
      "Validaciones",
      "Seguimiento",
    ],
  },
  {
    rol: "Coordinador de Unidades Receptoras",
    usuarios: 2,
    descripcion:
      "Administra empresas, convenios y unidades receptoras.",
    acceso: [
      "Empresas",
      "Convenios",
      "Padrón",
    ],
  },
  {
    rol: "Asesor Interno / Docente",
    usuarios: 8,
    descripcion:
      "Da seguimiento a alumnos asignados y registra observaciones.",
    acceso: [
      "Alumnos Asignados",
      "Observaciones",
      "Reportes",
    ],
  },
  {
    rol: "Dirección / Secretaría",
    usuarios: 2,
    descripcion:
      "Consulta estadísticas, indicadores y reportes ejecutivos.",
    acceso: [
      "Dashboard Ejecutivo",
      "Estadísticas",
      "Reportes",
    ],
  },
  {
    rol: "Alumno",
    usuarios: 844,
    descripcion:
      "Gestiona su documentación y seguimiento de prácticas.",
    acceso: [
      "Perfil",
      "Documentación",
      "Horas",
      "Notificaciones",
    ],
  },
];

export function AdminRolesPermisos() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Roles y Permisos
        </h1>

        <p className="text-gray-500 text-sm mt-1">
          Consulta de roles institucionales y accesos disponibles dentro del sistema.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        {[
          ["Roles registrados", "6", Shield, "bg-blue-600"],
          ["Usuarios activos", "859", Users, "bg-green-600"],
          ["Roles activos", "6", CheckCircle2, "bg-purple-600"],
        ].map(([titulo, valor, Icon, color]: any) => (
          <div
            key={titulo}
            className={`${color} rounded-2xl p-5 text-white`}
          >
            <Icon className="w-7 h-7 mb-3 opacity-80" />
            <div className="text-2xl font-bold">{valor}</div>
            <div className="text-white/80 text-sm">
              {titulo}
            </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {roles.map((item) => (
          <div
            key={item.rol}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-[#0d2b5e]">
                  {item.rol}
                </h3>

                <p className="text-sm text-gray-500 mt-1">
                  {item.descripcion}
                </p>
              </div>

              <Shield className="w-8 h-8 text-[#1565c0]" />
            </div>

            <div className="mt-4">
              <span className="text-sm font-semibold text-[#1565c0]">
                {item.usuarios} usuarios asignados
              </span>
            </div>

            <div className="mt-5">
              <h4 className="font-semibold text-[#0d2b5e] mb-3">
                Accesos principales
              </h4>

              <div className="flex flex-wrap gap-2">
                {item.acceso.map((modulo) => (
                  <span
                    key={modulo}
                    className="bg-blue-50 border border-blue-100 text-[#1565c0] px-3 py-1 rounded-full text-xs"
                  >
                    {modulo}
                  </span>
                ))}
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button className="border border-gray-200 rounded-xl px-4 py-2 text-sm font-semibold text-gray-600 flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Editar rol
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}