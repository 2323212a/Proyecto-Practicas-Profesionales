import {
  CalendarDays,
  GraduationCap,
  Users,
  Upload,
  Save,
  Settings,
  Mail,
  CheckCircle2,
} from "lucide-react";

export function AdminConfiguracion() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0d2b5e]">
          Configuración
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Parámetros institucionales y configuración del proceso
          de prácticas profesionales.
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-4">
        {[
          [
            "Convocatoria Activa",
            "Verano 2026",
            CalendarDays,
            "bg-blue-600",
          ],
          [
            "Alumnos Registrados",
            "844",
            GraduationCap,
            "bg-green-600",
          ],
          ["Usuarios Activos", "859", Users, "bg-purple-600"],
          ["Última Carga", "03 Jun", Upload, "bg-orange-500"],
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

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-[#0d2b5e] mb-5 flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#1565c0]" />
          Configuración Institucional
        </h3>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-semibold text-gray-700">
              Nombre del sistema
            </label>
            <input
              className="mt-2 w-full border rounded-xl px-3 py-2 text-sm"
              defaultValue="Sistema Integral de Prácticas Profesionales"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Escuela / Facultad
            </label>
            <input
              className="mt-2 w-full border rounded-xl px-3 py-2 text-sm"
              defaultValue="ETDA C-I"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Correo institucional
            </label>
            <input
              className="mt-2 w-full border rounded-xl px-3 py-2 text-sm"
              defaultValue="practicas@unach.mx"
            />
          </div>

          <div>
            <label className="text-sm font-semibold text-gray-700">
              Estado del sistema
            </label>
            <select className="mt-2 w-full border rounded-xl px-3 py-2 text-sm">
              <option>Activo</option>
              <option>Mantenimiento</option>
              <option>Suspendido</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5 flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-[#1565c0]" />
            Convocatoria Actual
          </h3>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-semibold text-gray-700">
                Convocatoria
              </label>
              <input
                className="mt-2 w-full border rounded-xl px-3 py-2 text-sm"
                defaultValue="Verano 2026"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Inicio
                </label>
                <input
                  type="date"
                  className="mt-2 w-full border rounded-xl px-3 py-2 text-sm"
                  defaultValue="2026-06-01"
                />
              </div>

              <div>
                <label className="text-sm font-semibold text-gray-700">
                  Cierre
                </label>
                <input
                  type="date"
                  className="mt-2 w-full border rounded-xl px-3 py-2 text-sm"
                  defaultValue="2026-07-11"
                />
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-[#0d2b5e]">
                Estas fechas controlan el registro de alumnos,
                validaciones y carga de documentación.
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5 flex items-center gap-2">
            <Upload className="w-5 h-5 text-[#1565c0]" />
            Carga Masiva de Alumnos
          </h3>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-green-700">
                844
              </div>
              <div className="text-sm text-green-600">
                Registros procesados
              </div>
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-orange-700">
                12
              </div>
              <div className="text-sm text-orange-600">
                Registros pendientes
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <div className="text-2xl font-bold text-blue-700">
                03 Jun
              </div>
              <div className="text-sm text-blue-600">
                Última importación
              </div>
            </div>
          </div>

          <div className="mt-5 bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm text-orange-700">
              La información cargada debe coincidir con los
              atributos definidos para evitar conflictos en el
              registro de alumnos.
            </p>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5 flex items-center gap-2">
            <Mail className="w-5 h-5 text-[#1565c0]" />
            Notificaciones del sistema
          </h3>

          <div className="space-y-3">
            {[
              "Notificar al alumno cuando su cuenta sea creada",
              "Avisar al administrador sobre errores de carga masiva",
              "Enviar aviso cuando una convocatoria esté por cerrar",
            ].map((item) => (
              <label
                key={item}
                className="flex items-center gap-3 text-sm text-gray-700"
              >
                <input
                  type="checkbox"
                  defaultChecked
                  className="w-4 h-4"
                />
                {item}
              </label>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <h3 className="font-bold text-[#0d2b5e] mb-5 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-[#1565c0]" />
            Estado administrativo
          </h3>

          <div className="space-y-3">
            {[
              "Roles institucionales configurados",
              "Catálogos base registrados",
              "Convocatoria activa disponible",
              "Carga masiva revisada",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-3 text-sm text-gray-700"
              >
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <button className="bg-[#1565c0] text-white rounded-xl px-5 py-2 text-sm font-semibold flex items-center gap-2">
          <Save className="w-4 h-4" />
          Guardar cambios
        </button>
      </div>
    </div>
  );
}