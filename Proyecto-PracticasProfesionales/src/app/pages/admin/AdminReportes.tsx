import {
  FileText,
  Download,
  Users,
  Shield,
  Database,
  KeyRound,
  History,
  AlertTriangle,
} from "lucide-react";

const reportes = [
  {
    titulo: "Reporte de Usuarios",
    descripcion: "Usuarios registrados, activos e inactivos dentro del sistema.",
    icono: Users,
  },
  {
    titulo: "Reporte de Roles",
    descripcion: "Distribución de usuarios por rol institucional.",
    icono: Shield,
  },
  {
    titulo: "Reporte de Carga Masiva",
    descripcion: "Alumnos importados, registros válidos y registros con error.",
    icono: Database,
  },
  {
    titulo: "Reporte de Contraseñas",
    descripcion: "Solicitudes de restablecimiento por protocolo de seguridad.",
    icono: KeyRound,
  },
  {
    titulo: "Historial de Cambios",
    descripcion: "Cambios de roles, usuarios removidos y acciones administrativas.",
    icono: History,
  },
  {
    titulo: "Reporte de Errores",
    descripcion: "Conflictos detectados durante la carga o actualización de datos.",
    icono: AlertTriangle,
  },
];

const historial = [
  ["03 jun 2026", "Carga masiva de alumnos", "844 registros procesados", "Completado"],
  ["03 jun 2026", "Reasignación de rol", "Carlos Méndez cambió a Asesor Interno", "Completado"],
  ["02 jun 2026", "Restablecimiento de contraseña", "Brayan Madain", "Completado"],
  ["01 jun 2026", "Carga masiva de alumnos", "12 registros con error", "Revisión"],
];

export function AdminReportes() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0d2b5e]">
            Reportes Administrativos
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Consulta y exportación de acciones realizadas por el administrador del sistema.
          </p>
        </div>

        <button className="bg-[#1565c0] text-white rounded-xl px-4 py-2 text-sm font-semibold flex items-center gap-2">
          <Download className="w-4 h-4" />
          Exportar general
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-4">
        <select className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option>Periodo actual</option>
          <option>Últimos 30 días</option>
          <option>Últimos 6 meses</option>
        </select>

        <select className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-sm">
          <option>Todos los módulos</option>
          <option>Gestión de Usuarios</option>
          <option>Roles y Permisos</option>
          <option>Catálogos</option>
        </select>

        <button className="bg-[#0d2b5e] text-white rounded-xl px-4 py-2 text-sm font-semibold">
          Generar reporte
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-5">
        {reportes.map((reporte) => (
          <div
            key={reporte.titulo}
            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
          >
            <reporte.icono className="w-9 h-9 text-[#1565c0] mb-4" />

            <h3 className="font-bold text-[#0d2b5e]">
              {reporte.titulo}
            </h3>

            <p className="text-sm text-gray-500 mt-2 mb-5">
              {reporte.descripcion}
            </p>

            <div className="flex gap-2">
              <button className="flex-1 border border-blue-200 text-[#1565c0] rounded-xl py-2 text-sm font-semibold">
                Ver
              </button>

              <button className="flex-1 bg-[#1565c0] text-white rounded-xl py-2 text-sm font-semibold flex items-center justify-center gap-2">
                <Download className="w-4 h-4" />
                PDF
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-5">
          Historial de actividad administrativa
        </h3>

        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-500 border-b">
              <th className="py-3">Fecha</th>
              <th>Actividad</th>
              <th>Detalle</th>
              <th>Estado</th>
            </tr>
          </thead>

          <tbody>
            {historial.map((row) => (
              <tr key={`${row[0]}-${row[1]}`} className="border-b last:border-0">
                <td className="py-3 text-gray-700">{row[0]}</td>
                <td className="text-gray-700">{row[1]}</td>
                <td className="text-gray-600">{row[2]}</td>
                <td>
                  <span
                    className={`px-3 py-1 rounded-full text-xs ${
                      row[3] === "Completado"
                        ? "bg-green-100 text-green-700"
                        : "bg-orange-100 text-orange-700"
                    }`}
                  >
                    {row[3]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}